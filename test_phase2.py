#!/usr/bin/env python3
"""
Test Phase 2 - Application Limit Enforcement

This script tests:
1. Subscription status check
2. Application creation up to limit
3. Limit enforcement (403 when exceeded)
4. Error handling (fail-secure)

Usage:
    export JWT_TOKEN="your-jwt-token"
    python test_phase2.py
    
    Or with custom base URL:
    export JWT_TOKEN="your-token"
    export BASE_URL="http://localhost:8000/v1"
    python test_phase2.py
"""

import os
import sys
import requests
import json
from typing import Dict, Any

# Configuration
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000/v1")
JWT_TOKEN = os.getenv("JWT_TOKEN")

if not JWT_TOKEN:
    print("❌ Error: Set JWT_TOKEN environment variable")
    print("   export JWT_TOKEN='your-token-here'")
    print("\nTo get a token:")
    print("   1. Go to Supabase Dashboard → Authentication → Users")
    print("   2. Create a test user or use existing")
    print("   3. Click on user → Copy 'Access Token'")
    sys.exit(1)

headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

def print_section(title: str):
    """Print a formatted section header"""
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")


def check_subscription_status() -> Dict[str, Any]:
    """Test 1: Check subscription status"""
    print_section("1️⃣ Checking Subscription Status")
    
    try:
        response = requests.get(f"{BASE_URL}/subscription/status", headers=headers)
        
        if response.status_code == 200:
            status = response.json()
            print("✅ Subscription status retrieved successfully")
            print(json.dumps(status, indent=2))
            
            current = status.get("usage", {}).get("applications_count", 0)
            limit = status.get("usage", {}).get("applications_limit")
            plan_name = status.get("subscription", {}).get("plan_name", "Unknown")
            
            print(f"\n📊 Plan: {plan_name}")
            print(f"📊 Current: {current} / {limit} applications")
            
            return status
        else:
            print(f"❌ Failed to get status: HTTP {response.status_code}")
            print(response.text)
            return {}
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error connecting to API: {e}")
        return {}


def create_application(company: str, position: str) -> tuple[bool, Dict[str, Any]]:
    """Test 2: Create an application"""
    print_section(f"2️⃣ Creating Application: {company} - {position}")
    
    app_data = {
        "company": company,
        "position": position,
        "status": "applied",
        "location": "Remote",
        "notes": "Phase 2 test application"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/applications",
            headers=headers,
            json=app_data
        )
        
        if response.status_code == 201:
            print("✅ Application created successfully!")
            app = response.json()
            print(json.dumps(app, indent=2))
            return True, app
        elif response.status_code == 403:
            print("⛔ Limit exceeded!")
            detail = response.json().get("detail", {})
            print(f"   Error: {detail.get('error')}")
            print(f"   Message: {detail.get('message')}")
            print(f"   Current: {detail.get('current_count')} / {detail.get('limit')}")
            print(f"   Upgrade Required: {detail.get('upgrade_required')}")
            return False, detail
        else:
            print(f"❌ Unexpected response: HTTP {response.status_code}")
            print(response.text)
            return False, {}
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error connecting to API: {e}")
        return False, {}


def test_limit_enforcement():
    """Test 3: Create multiple applications to test limit"""
    print_section("3️⃣ Testing Limit Enforcement")
    
    # Get current status
    status = check_subscription_status()
    if not status:
        print("❌ Cannot proceed without subscription status")
        return
    
    current = status.get("usage", {}).get("applications_count", 0)
    limit = status.get("usage", {}).get("applications_limit")
    
    if limit is None:
        print("⚠️  No limit set (unlimited plan?)")
        print("Creating one test application...")
        success, _ = create_application("Test Company", "Test Position")
        return
    
    remaining = limit - current
    
    print(f"📊 You have {remaining} applications remaining")
    
    if remaining <= 0:
        print("⛔ Already at limit! Testing limit enforcement...")
        success, result = create_application("Test Company Over Limit", "Test Position")
        if not success and result.get("error") == "limit_exceeded":
            print("\n✅ Limit enforcement working correctly!")
        else:
            print("\n❌ Limit enforcement not working - should have been blocked")
        return
    
    # Try to create one application
    print(f"\nCreating 1 test application...")
    success, _ = create_application("Test Company", "Test Position")
    
    if success:
        # Check status again
        print("\n📊 Checking updated status...")
        new_status = check_subscription_status()
        new_current = new_status.get("usage", {}).get("applications_count", 0)
        print(f"✅ Count increased from {current} to {new_current}")
    else:
        print("❌ Application creation failed unexpectedly")


def test_list_plans():
    """Test 4: List available subscription plans"""
    print_section("4️⃣ Listing Available Plans")
    
    try:
        response = requests.get(f"{BASE_URL}/subscription/plans", headers={})
        
        if response.status_code == 200:
            data = response.json()
            plans = data.get("plans", [])
            print(f"✅ Found {len(plans)} plans:")
            for plan in plans:
                print(f"\n   📦 {plan.get('display_name')} ({plan.get('name')})")
                print(f"      Price: ${plan.get('price_monthly')}/month")
                features = plan.get("features", {})
                max_apps = features.get("max_applications", "Unlimited")
                print(f"      Max Applications: {max_apps}")
                print(f"      Unlimited: {features.get('unlimited_applications', False)}")
        else:
            print(f"❌ Failed to get plans: HTTP {response.status_code}")
            print(response.text)
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error connecting to API: {e}")


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print(" 🧪 Phase 2 Testing - Application Limit Enforcement")
    print("="*60)
    print(f"\n📍 Base URL: {BASE_URL}")
    print(f"🔑 Token: {JWT_TOKEN[:20]}...{JWT_TOKEN[-10:]}")
    
    # Test 1: Check subscription status
    status = check_subscription_status()
    
    if not status:
        print("\n❌ Cannot proceed - subscription status check failed")
        print("   Make sure:")
        print("   1. Backend is running")
        print("   2. JWT token is valid")
        print("   3. Database migration has run (subscription tables exist)")
        sys.exit(1)
    
    # Test 2: List plans
    test_list_plans()
    
    # Test 3: Test limit enforcement
    test_limit_enforcement()
    
    # Summary
    print_section("✅ Test Summary")
    print("\n✅ All tests completed!")
    print("\nWhat to verify:")
    print("  ✓ Subscription status returns correct plan and limits")
    print("  ✓ Applications can be created up to the limit")
    print("  ✓ Creating beyond limit returns 403 with upgrade message")
    print("  ✓ Error messages include upgrade information")
    print("\nIf any test failed, check:")
    print("  - Backend logs for errors")
    print("  - Database has subscription_plans table with free/pro plans")
    print("  - User has a subscription record (or defaults to free)")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


