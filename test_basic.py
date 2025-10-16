#!/usr/bin/env python3
"""
Basic test to see if Python files are working in Railway
"""
print("🚀 Basic test script is running!")
print("Environment variables:")
import os
print(f"PORT: {os.getenv('PORT', 'NOT_SET')}")
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL', 'NOT_SET')}")
print(f"DATABASE_URL: {os.getenv('DATABASE_URL', 'NOT_SET')}")
print("✅ Test completed successfully!")
