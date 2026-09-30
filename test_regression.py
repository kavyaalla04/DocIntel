"""Full Automated Regression Test Suite for Document Intelligence Platform"""
import urllib.request
import json
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:3000"

def log_test(name, success, details=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"[{status}] {name} {details}")
    return success

def run_tests():
    print("🚀 Running End-to-End System Regression Test Suite...\n")
    results = []

    # 1. Health & Readiness Check
    try:
        req = urllib.request.urlopen(f"{BASE_URL}/health")
        data = json.loads(req.read().decode('utf-8'))
        results.append(log_test("GET /health", data.get("status") == "healthy", f"Provider: {data.get('llm_provider')}"))
    except Exception as e:
        results.append(log_test("GET /health", False, str(e)))

    # 2. Readiness Probe
    try:
        req = urllib.request.urlopen(f"{BASE_URL}/ready")
        data = json.loads(req.read().decode('utf-8'))
        results.append(log_test("GET /ready", data.get("ready") == True, f"DB: {data.get('database')}"))
    except Exception as e:
        results.append(log_test("GET /ready", False, str(e)))

    # 3. User Login
    try:
        login_data = json.dumps({"email": "architect@enterprise.com", "password": "password123"}).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/v1/auth/login", data=login_data, headers={'Content-Type': 'application/json'})
        resp = urllib.request.urlopen(req)
        data = json.loads(resp.read().decode('utf-8'))
        results.append(log_test("POST /api/v1/auth/login", "token" in data, f"Role: {data.get('user', {}).get('role')}"))
    except Exception as e:
        results.append(log_test("POST /api/v1/auth/login", False, str(e)))

    # 4. Load Demo Dataset
    doc_id = None
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/v1/demo/load", data=b'{}', headers={'Content-Type': 'application/json'})
        resp = urllib.request.urlopen(req)
        data = json.loads(resp.read().decode('utf-8'))
        docs = data.get("documents", [])
        if docs:
            doc_id = docs[0].get("documentId")
        results.append(log_test("POST /api/v1/demo/load", len(docs) > 0, f"Loaded {len(docs)} documents"))
    except Exception as e:
        results.append(log_test("POST /api/v1/demo/load", False, str(e)))

    # 5. List Documents
    try:
        req = urllib.request.urlopen(f"{BASE_URL}/api/v1/documents?organizationId=org_default")
        data = json.loads(req.read().decode('utf-8'))
        results.append(log_test("GET /api/v1/documents", "documents" in data, f"Total: {data.get('total')}"))
    except Exception as e:
        results.append(log_test("GET /api/v1/documents", False, str(e)))

    # 6. Generate Summary (with Resilient Fallback if Key Limit Exceeded)
    summary_id = None
    if doc_id:
        try:
            payload = json.dumps({
                "documentId": doc_id,
                "organizationId": "org_default",
                "config": {"type": "executive", "summaryLength": "medium", "temperature": 0.7, "maxTokens": 1024}
            }).encode('utf-8')
            req = urllib.request.Request(f"{BASE_URL}/api/v1/summaries/generate", data=payload, headers={'Content-Type': 'application/json'})
            resp = urllib.request.urlopen(req)
            data = json.loads(resp.read().decode('utf-8'))
            summary_id = data.get("summaryId")
            results.append(log_test("POST /api/v1/summaries/generate", "content" in data, f"Quality Score: {data.get('qualityScore')}"))
        except Exception as e:
            results.append(log_test("POST /api/v1/summaries/generate", False, str(e)))

    # 7. Document Q&A
    if doc_id:
        try:
            payload = json.dumps({"question": "What are the major operational and financial risks mentioned?"}).encode('utf-8')
            req = urllib.request.Request(f"{BASE_URL}/api/v1/documents/{doc_id}/qa", data=payload, headers={'Content-Type': 'application/json'})
            resp = urllib.request.urlopen(req)
            data = json.loads(resp.read().decode('utf-8'))
            results.append(log_test("POST /api/v1/documents/{id}/qa", "answer" in data, f"Citations count: {len(data.get('citations', []))}"))
        except Exception as e:
            results.append(log_test("POST /api/v1/documents/{id}/qa", False, str(e)))

    # 8. Conversations History
    try:
        req = urllib.request.urlopen(f"{BASE_URL}/api/v1/conversations")
        data = json.loads(req.read().decode('utf-8'))
        results.append(log_test("GET /api/v1/conversations", "conversations" in data, f"Saved sessions: {len(data.get('conversations', []))}"))
    except Exception as e:
        results.append(log_test("GET /api/v1/conversations", False, str(e)))

    # 9. Quality Evaluation & GovReport Benchmark
    try:
        req = urllib.request.urlopen(f"{BASE_URL}/api/v1/evaluations/govreport?sampleIndex=0")
        data = json.loads(req.read().decode('utf-8'))
        metrics = data.get("metrics", {})
        results.append(log_test("GET /api/v1/evaluations/govreport", "metrics" in data, f"ROUGE-1: {metrics.get('relevance')}%, Groundedness: {metrics.get('groundedness')}%"))
    except Exception as e:
        results.append(log_test("GET /api/v1/evaluations/govreport", False, str(e)))

    # 10. Cost Analytics
    try:
        req = urllib.request.urlopen(f"{BASE_URL}/api/v1/organizations/org_default/costs")
        data = json.loads(req.read().decode('utf-8'))
        results.append(log_test("GET /api/v1/organizations/{id}/costs", "totalCost" in data, f"Total Cost: ${data.get('totalCost')}"))
    except Exception as e:
        results.append(log_test("GET /api/v1/organizations/{id}/costs", False, str(e)))

    print("\n==========================================")
    passed = sum(1 for r in results if r)
    total = len(results)
    print(f"📊 REGRESSION TEST SUMMARY: {passed}/{total} PASSED ({(passed/total)*100:.1f}%)")
    print("==========================================\n")

if __name__ == "__main__":
    run_tests()
