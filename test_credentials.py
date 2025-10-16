#!/usr/bin/env python3
"""
Test Supabase Credentials Script

This script helps you test if your Supabase credentials are working correctly.
Run this before updating Railway variables to make sure everything works.
"""

import os
import sys
from supabase import create_client
import psycopg

def test_supabase_connection():
    """Test Supabase client connection"""
    print("🔍 Testing Supabase client connection...")
    
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
            return False
        
        # Create Supabase client
        supabase = create_client(supabase_url, supabase_key)
        
        # Test connection by trying to query a table
        # This will fail if the table doesn't exist, but that's okay - we just want to test auth
        try:
            result = supabase.table("profiles").select("id").limit(1).execute()
            print("✅ Supabase client connection successful")
            return True
        except Exception as e:
            if "relation \"profiles\" does not exist" in str(e):
                print("✅ Supabase client connection successful (tables not created yet)")
                return True
            else:
                print(f"❌ Supabase client error: {e}")
                return False
                
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        return False

def test_database_connection():
    """Test direct PostgreSQL connection"""
    print("🔍 Testing PostgreSQL connection...")
    
    try:
        database_url = os.getenv("DATABASE_URL")
        
        if not database_url:
            print("❌ Missing DATABASE_URL")
            return False
        
        # Test connection
        conn = psycopg.connect(database_url)
        cursor = conn.cursor()
        
        # Test query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"✅ PostgreSQL connection successful")
        print(f"   Database version: {version[:50]}...")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        return False

def main():
    print("🚀 TrackMail Credentials Test")
    print("=" * 50)
    
    # Load environment variables
    print("📋 Loading environment variables...")
    
    # You can set these manually for testing:
    # os.environ["SUPABASE_URL"] = "https://fvpggfqkmldgwjbanwyr.supabase.co"
    # os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "your-service-role-key-here"
    # os.environ["DATABASE_URL"] = "postgresql://postgres:your-password@db.fvpggfqkmldgwjbanwyr.supabase.co:5432/postgres"
    
    # Test connections
    supabase_ok = test_supabase_connection()
    database_ok = test_database_connection()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"   Supabase Client: {'✅ PASS' if supabase_ok else '❌ FAIL'}")
    print(f"   PostgreSQL DB:   {'✅ PASS' if database_ok else '❌ FAIL'}")
    
    if supabase_ok and database_ok:
        print("\n🎉 All credentials are working! You can now update Railway variables.")
        return 0
    else:
        print("\n❌ Some credentials failed. Please check your values.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
