# API Examples

## Public Attendance Flow (No Login)
```bash
curl -X POST http://localhost:5000/api/face-identify \
  -H "Content-Type: application/json" \
  -d '{"liveDescriptor":[0.12,0.03,...]}'
```

## Hybrid Fallback (with Register Number)
```bash
curl -X POST http://localhost:5000/api/verify-student \
  -H "Content-Type: application/json" \
  -d '{"registerNumber":"22CSE001"}'
```

```bash
curl -X POST http://localhost:5000/api/face-verify \
  -H "Content-Type: application/json" \
  -d '{"registerNumber":"22CSE001","liveDescriptor":[0.12,0.03,...]}'
```

```bash
curl -X POST http://localhost:5000/api/mark-attendance \
  -H "Content-Type: application/json" \
  -d '{"registerNumber":"22CSE001","liveDescriptor":[0.12,0.03,...]}'
```

## Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@school.edu","password":"Pass@123"}'
```

## Faculty: All Students
```bash
curl http://localhost:5000/api/students \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## Faculty: Report
```bash
curl "http://localhost:5000/api/attendance/report?from=2026-04-01&to=2026-04-30" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## Student: My Attendance
```bash
curl http://localhost:5000/api/attendance/my \
  -H "Authorization: Bearer <JWT_TOKEN>"
```
