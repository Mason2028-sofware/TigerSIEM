## Inspiration
Security systems generate massive amounts of log data, making it difficult to detect threats quickly while maintaining access to historical information. We wanted to explore how TigerData's Hypercore technology could address both challenges through efficient storage and fast security analytics.

Our team brought together a unique combination of backgrounds: two Cybersecurity majors, one Computer Science major with professional IT experience, and one Software Engineering major. This gave us a great opportunity to combine our strengths in security, infrastructure, and software development to build a complete SIEM platform.
## What it does
TigerSIEM is a Security Information and Event Management (SIEM) platform that collects, stores, and analyzes security events across multiple virtual machines.

It monitors SSH authentication attempts and network activity, identifies suspicious behavior such as failed logins and potential TCP SYN scans, and supports historical security investigations. Users can analyze event trends across selected date ranges and examine query performance.
## How we built it
We developed a three-VM architecture using Fluent Bit to collect and forward security logs into TigerData. Events are stored in a PostgreSQL-compatible hypertable configured with Hypercore and automated compression policies.

Our Python backend uses SQLAlchemy to query TigerData, while FastAPI exposes REST endpoints for security events, threat statistics, historical analytics, and performance benchmarks.

We use TigerData's time_bucket() functionality for efficient time-series aggregation. Our React frontend provides the dashboard interface for displaying security information.
## Challenges we ran into
Our biggest challenge was integrating multiple virtual machines, log collection tools, cloud storage, and backend services into a functioning pipeline.

We also needed to separate simulated historical data from real security events while maintaining accurate statistics and efficient queries.
## Accomplishments that we're proud of
- Built a working VM-to-TigerData security logging pipeline.
- Integrated SSH authentication monitoring and Suricata network alerts.
- Implemented historical analytics with date-range filtering.
- Configured Hypercore-enabled storage and automated compression.
- Developed and tested FastAPI endpoints and query performance benchmarks.
## What we learned
We gained hands-on experience with SIEM architecture, distributed systems, REST APIs, and time-series databases. Our different academic and professional backgrounds also taught us how to approach technical problems collaboratively, combining cybersecurity expertise with software engineering and IT infrastructure knowledge.
## What's next for TigerSIEM
We plan to expand threat detection capabilities, improve dashboard visualizations, and introduce more advanced security analytics.

We also want to benchmark rowstore versus columnstore query performance to further demonstrate Hypercore's advantages for historical security investigations.
