from setuptools import setup, find_packages

setup(
    name="trackmail",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.100.0",
        "uvicorn[standard]>=0.20.0",
        "pydantic>=2.0.0",
        "supabase>=2.0.0",
        "python-multipart>=0.0.5",
        "python-dotenv>=1.0.0",
        "httpx>=0.24.0",
    ],
    python_requires=">=3.11",
)
