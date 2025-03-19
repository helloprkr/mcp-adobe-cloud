from setuptools import setup, find_packages

setup(
    name="adobe-mcp",
    version="0.1.0",
    description="Model Context Protocol integration for Adobe software",
    author="Adobe MCP Team",
    author_email="support@adobemcp.example.com",
    packages=find_packages(),
    install_requires=[
        "mcp>=1.4.0",
        "httpx>=0.24.0",
        "pydantic>=2.0.0",
        "python-dotenv>=1.0.0",
    ],
    entry_points={
        "console_scripts": [
            "adobe-mcp=adobe_mcp.server:main",
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
    python_requires=">=3.8",
) 