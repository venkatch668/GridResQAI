"""
GridResQ - TSSPDCL Operations Automation Test Suite
Comprehensive Automated Integration and API Tests for Build Submission Evidence
"""

import unittest
import uuid
import datetime
from fastapi.testclient import TestClient

from server.main import app
from server.database.session import Base, engine


class GridResQAPITestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Ensure database tables exist and initialize test client."""
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    # =========================================================================
    # 1. Health & System Status Tests
    # =========================================================================
    def test_01_health_check(self):
        """Verify API health endpoint and operational division metadata."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "HEALTHY")
        self.assertEqual(data["service"], "GridResQ API")
        self.assertIn("TSSPDCL", data["division"])

    # =========================================================================
    # 2. Authentication & Authorization Tests
    # =========================================================================
    def test_02_login_valid_credentials(self):
        """Test authentication with valid NOC dispatcher credentials."""
        payload = {
            "email": "ramesh.varma@tsspdcl.gov.in",
            "password": "Password123!"
        }
        response = self.client.post("/api/auth/login", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")
        self.assertEqual(data["user"]["email"], "ramesh.varma@tsspdcl.gov.in")
        self.assertEqual(data["user"]["role"], "NOC_OPERATOR")

    def test_03_login_invalid_password(self):
        """Test authentication failure with incorrect password."""
        payload = {
            "email": "ramesh.varma@tsspdcl.gov.in",
            "password": "WrongPassword999!"
        }
        response = self.client.post("/api/auth/login", json=payload)
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertIn("detail", data)

    def test_04_login_nonexistent_user(self):
        """Test authentication failure with unregistered email address."""
        payload = {
            "email": "unknown.officer@tsspdcl.gov.in",
            "password": "Password123!"
        }
        response = self.client.post("/api/auth/login", json=payload)
        self.assertEqual(response.status_code, 401)

    def test_05_auth_me_profile_with_token(self):
        """Verify authenticated user profile retrieval using JWT Bearer token."""
        # Step 1: Login to get token
        login_resp = self.client.post("/api/auth/login", json={
            "email": "srinivas.reddy@tsspdcl.gov.in",
            "password": "Password123!"
        })
        self.assertEqual(login_resp.status_code, 200)
        token = login_resp.json()["access_token"]

        # Step 2: Fetch profile
        headers = {"Authorization": f"Bearer {token}"}
        me_resp = self.client.get("/api/auth/me", headers=headers)
        self.assertEqual(me_resp.status_code, 200)
        user_data = me_resp.json()
        self.assertEqual(user_data["email"], "srinivas.reddy@tsspdcl.gov.in")
        self.assertEqual(user_data["role"], "SECTION_ENGINEER")

    def test_06_auth_me_unauthorized_without_token(self):
        """Verify endpoint protection against unauthenticated access."""
        response = self.client.get("/api/auth/me")
        self.assertEqual(response.status_code, 401)

    def test_07_signup_new_officer_account(self):
        """Test registering a new TSSPDCL field lineman account."""
        unique_suffix = uuid.uuid4().hex[:6]
        signup_payload = {
            "full_name": f"Lineman Test-{unique_suffix}",
            "email": f"lineman.{unique_suffix}@tsspdcl.gov.in",
            "password": "SecurePassword123!",
            "phone": "+91 94408 99999",
            "role": "FIELD_LINEMAN",
            "section_office": "Kondapur Section, TSSPDCL"
        }
        response = self.client.post("/api/auth/signup", json=signup_payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], signup_payload["email"])
        self.assertEqual(data["user"]["role"], "FIELD_LINEMAN")

    def test_08_signup_duplicate_email_rejected(self):
        """Verify system prevents duplicate email registration."""
        payload = {
            "full_name": "Duplicate Tester",
            "email": "ramesh.varma@tsspdcl.gov.in",
            "password": "Password123!",
            "role": "NOC_OPERATOR"
        }
        response = self.client.post("/api/auth/signup", json=payload)
        self.assertEqual(response.status_code, 400)
        detail = response.json()["detail"].lower()
        self.assertTrue("already" in detail, f"Expected 'already' in detail message, got: {detail}")

    # =========================================================================
    # 3. Incident Ticket Management & CRUD Workflow Tests
    # =========================================================================
    def test_09_list_incident_tickets(self):
        """Verify listing of outage incident tickets with metadata."""
        response = self.client.get("/api/tickets")
        self.assertEqual(response.status_code, 200)
        tickets = response.json()
        self.assertIsInstance(tickets, list)
        self.assertGreater(len(tickets), 0)
        first = tickets[0]
        self.assertIn("ticket_number", first)
        self.assertIn("status", first)
        self.assertIn("priority", first)

    def test_10_filter_incident_tickets_by_status(self):
        """Test filtering tickets by status (OPEN, IN_PROGRESS, RESOLVED)."""
        response = self.client.get("/api/tickets?status=OPEN")
        self.assertEqual(response.status_code, 200)
        tickets = response.json()
        for t in tickets:
            self.assertEqual(t["status"], "OPEN")

    def test_11_create_new_outage_ticket(self):
        """Test creating a new incident ticket for a tripped feeder."""
        ticket_payload = {
            "ticket_number": f"TKT-AUTO-{uuid.uuid4().hex[:4].upper()}",
            "primary_asset_code": "F-04",
            "primary_asset_type": "FEEDER",
            "summary": "11kV Feeder F-04 tripped on transient earth fault near DLF Junction",
            "locality": "Gachibowli, Hyderabad",
            "substation_name": "Gachibowli 33/11kV Substation",
            "section_office": "Gachibowli Section",
            "service_connection_no": "USC-10499201",
            "priority": "P1_CRITICAL",
            "status": "OPEN",
            "consumers_affected": 420
        }
        response = self.client.post("/api/tickets", json=ticket_payload)
        self.assertEqual(response.status_code, 200)
        new_ticket = response.json()
        self.assertTrue(new_ticket["ticket_number"].startswith("TKT-AUTO-"))
        self.assertEqual(new_ticket["status"], "OPEN")
        self.assertEqual(new_ticket["priority"], "P1_CRITICAL")
        self.assertEqual(new_ticket["consumers_affected"], 420)
        # Store for subsequent workflow steps
        self.__class__.created_ticket_id = new_ticket["id"]

    def test_12_add_work_comment_to_ticket(self):
        """Test appending an immutable activity note/comment to an incident ticket."""
        ticket_id = getattr(self.__class__, "created_ticket_id", "tkt-001")
        comment_payload = {
            "author": "Operator Ramesh Varma",
            "role": "OPERATOR",
            "content": "Notified Madhapur Section AE. Heavy line patrol initiated."
        }
        response = self.client.post(f"/api/tickets/{ticket_id}/comments", json=comment_payload)
        self.assertEqual(response.status_code, 200)
        comment = response.json()
        self.assertEqual(comment["author"], "Operator Ramesh Varma")
        self.assertEqual(comment["role"], "OPERATOR")
        self.assertIn("Notified Madhapur Section AE", comment["content"])

    def test_13_assign_individual_lineman_to_ticket(self):
        """Test dispatching and assigning a specific lineman to an incident."""
        ticket_id = getattr(self.__class__, "created_ticket_id", "tkt-001")
        assign_payload = {
            "technician_id": "tech-mdp-2"
        }
        response = self.client.post(f"/api/tickets/{ticket_id}/assign-technician", json=assign_payload)
        self.assertEqual(response.status_code, 200)
        updated_ticket = response.json()
        self.assertEqual(updated_ticket["status"], "IN_PROGRESS")
        self.assertEqual(updated_ticket["allocated_technician_id"], "tech-mdp-2")
        self.assertIsNotNone(updated_ticket["assigned_technician_name"])

    def test_14_resolve_incident_ticket(self):
        """Test completing outage restoration with resolution category and remarks."""
        ticket_id = getattr(self.__class__, "created_ticket_id", "tkt-001")
        resolve_payload = {
            "category": "11kV Line Patrol & Vegetation Clearance",
            "reason": "Patrol completed. Fallen eucalyptus branch cleared from F-04 11kV conductor. Feeder recharged."
        }
        response = self.client.post(f"/api/tickets/{ticket_id}/resolve", json=resolve_payload)
        self.assertEqual(response.status_code, 200)
        resolved_ticket = response.json()
        self.assertEqual(resolved_ticket["status"], "RESOLVED")
        self.assertEqual(resolved_ticket["resolution_category"], resolve_payload["category"])
        self.assertIsNotNone(resolved_ticket["resolved_at"])

    def test_15_reopen_incident_ticket(self):
        """Test reopening a resolved ticket upon customer persistent outage report."""
        ticket_id = getattr(self.__class__, "created_ticket_id", "tkt-001")
        response = self.client.post(f"/api/tickets/{ticket_id}/reopen")
        self.assertEqual(response.status_code, 200)
        reopened = response.json()
        self.assertEqual(reopened["status"], "OPEN")

    def test_16_escalate_incident_ticket(self):
        """Test escalating an incident to Divisional Engineer for specialized equipment."""
        ticket_id = getattr(self.__class__, "created_ticket_id", "tkt-001")
        escalate_payload = {
            "reason": "Escalated to Cybercity Divisional Engineer for mobile transformer van."
        }
        response = self.client.post(f"/api/tickets/{ticket_id}/escalate", json=escalate_payload)
        self.assertEqual(response.status_code, 200)
        escalated = response.json()
        self.assertEqual(escalated["status"], "ESCALATED")

    # =========================================================================
    # 4. Field Crew & Lineman Fleet Tests
    # =========================================================================
    def test_17_list_section_gangs(self):
        """Verify listing of Section Gangs with vehicle IDs and members."""
        response = self.client.get("/api/crews")
        self.assertEqual(response.status_code, 200)
        gangs = response.json()
        self.assertIsInstance(gangs, list)
        self.assertGreater(len(gangs), 0)
        first_gang = gangs[0]
        self.assertIn("vehicle_number", first_gang)
        self.assertIn("lead_name", first_gang)
        self.assertIn("members", first_gang)

    def test_18_list_individual_linemen(self):
        """Verify listing of individual linemen technicians with status and contact."""
        response = self.client.get("/api/technicians")
        self.assertEqual(response.status_code, 200)
        linemen = response.json()
        self.assertIsInstance(linemen, list)
        self.assertGreater(len(linemen), 0)
        first_lineman = linemen[0]
        self.assertIn("name", first_lineman)
        self.assertIn("phone", first_lineman)
        self.assertIn("status", first_lineman)
        self.assertIn(first_lineman["status"], ["AVAILABLE", "ASSIGNED", "RESTING"])

    def test_19_release_technician_to_available(self):
        """Test releasing an assigned lineman back to AVAILABLE status upon job finish."""
        response = self.client.post("/api/technicians/tech-mdp-2/release")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "AVAILABLE")
        self.assertIsNone(data.get("assigned_ticket_id"))

    # =========================================================================
    # 5. Grid Topology & Telemetry Tests
    # =========================================================================
    def test_20_list_substations_and_feeders(self):
        """Verify grid hierarchy: 33/11kV substations and connected feeders."""
        response = self.client.get("/api/topology/substations")
        self.assertEqual(response.status_code, 200)
        substations = response.json()
        self.assertIsInstance(substations, list)
        self.assertGreater(len(substations), 0)
        sub = substations[0]
        self.assertIn("id", sub)
        self.assertIn("name", sub)
        self.assertIn("feeders", sub)

    def test_21_list_distribution_transformers(self):
        """Verify retrieval of Distribution Transformers (DTRs) under active hubs."""
        response = self.client.get("/api/topology/transformers")
        self.assertEqual(response.status_code, 200)
        transformers = response.json()
        self.assertIsInstance(transformers, list)
        self.assertGreater(len(transformers), 0)
        tr = transformers[0]
        self.assertIn("capacity_kva", tr)
        self.assertIn("dtr_code", tr)

    def test_22_simulate_transformer_trip(self):
        """Test telemetry fault injection on a Distribution Transformer."""
        response = self.client.post("/api/topology/transformers/dtr-mdp-101/simulate-trip")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "FAILED")

    # =========================================================================
    # 6. Telephony Inbound & AI Bounded Diagnosis Tests
    # =========================================================================
    def test_23_simulate_1912_inbound_call(self):
        """Test simulating an inbound 1912 IVR consumer helpline call."""
        payload = {
            "caller_phone": "+91 98490 88210",
            "locality": "Madhapur, Hyderabad",
            "matched_usc_number": "USC-5018820"
        }
        response = self.client.post("/api/telephony/simulate", json=payload)
        self.assertEqual(response.status_code, 200)
        call = response.json()
        self.assertIn("id", call)
        self.assertEqual(call["status"], "IN_PROGRESS")

    def test_24_ai_bounded_diagnosis(self):
        """Verify Gemini evidence-bounded root cause diagnosis generation."""
        response = self.client.get("/api/diagnosis/tkt-001")
        self.assertEqual(response.status_code, 200)
        diag = response.json()
        self.assertIn("ticket_id", diag)
        self.assertIn("primary_hypothesis_title", diag)
        self.assertIn("confidence_score", diag)
        self.assertGreater(diag["confidence_score"], 0.0)
        self.assertIn("evidence_tags", diag)
        self.assertGreater(len(diag["evidence_tags"]), 0)


if __name__ == "__main__":
    unittest.main()
