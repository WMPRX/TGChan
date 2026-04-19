#!/bin/bash
# Persistent dev server with warm-up and auto-restart
# Runs in foreground as a long-lived process

cd /home/z/my-project

while true; do
  # Kill any existing server
  pkill -f "next dev" 2>/dev/null || true
  pkill -f "next-server" 2>/dev/null || true
  sleep 2

  # Start the server
  NODE_OPTIONS="--max-old-space-size=4096" npx next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
  SERVER_PID=$!
  echo "[$(date)] Started server PID: $SERVER_PID" >> /home/z/my-project/dev.log

  # Wait for ready
  for i in $(seq 1 30); do
    if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
      echo "[$(date)] Server ready" >> /home/z/my-project/dev.log
      break
    fi
    sleep 2
  done

  # Warm up routes sequentially
  echo "[$(date)] Warming up routes..." >> /home/z/my-project/dev.log
  curl -s -o /dev/null -m 60 http://localhost:3000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"warmup","password":"warmup"}' 2>/dev/null || true
  sleep 2
  curl -s -o /dev/null -m 60 http://localhost:3000/api/auth/register -X POST -H "Content-Type: application/json" -d '{"name":"w","username":"w","email":"w@w.com","password":"warmup123456"}' 2>/dev/null || true
  sleep 2
  curl -s -o /dev/null -m 60 http://localhost:3000/ 2>/dev/null || true
  sleep 3
  curl -s -o /dev/null -m 60 "http://localhost:3000/api/channels?language=global&sort=members&page=1&limit=3" 2>/dev/null || true
  sleep 1
  curl -s -o /dev/null -m 60 http://localhost:3000/api/categories 2>/dev/null || true
  sleep 1
  curl -s -o /dev/null -m 60 http://localhost:3000/api/languages 2>/dev/null || true
  sleep 1
  curl -s -o /dev/null -m 60 http://localhost:3000/api/premium/plans 2>/dev/null || true
  sleep 1
  curl -s -o /dev/null -m 60 http://localhost:3000/api/channels/1 2>/dev/null || true
  sleep 1
  curl -s -o /dev/null -m 60 http://localhost:3000/api/stats 2>/dev/null || true
  sleep 1
  curl -s -o /dev/null -m 60 http://localhost:3000/api/seed 2>/dev/null || true
  sleep 1

  echo "[$(date)] All routes warmed up!" >> /home/z/my-project/dev.log

  # Keep monitoring the server
  while true; do
    if ! kill -0 $SERVER_PID 2>/dev/null; then
      echo "[$(date)] Server died! Restarting..." >> /home/z/my-project/dev.log
      break
    fi
    # Also check if the server responds
    if ! curl -s -o /dev/null -m 5 http://localhost:3000/ 2>/dev/null; then
      echo "[$(date)] Server not responding! Restarting..." >> /home/z/my-project/dev.log
      kill $SERVER_PID 2>/dev/null || true
      break
    fi
    sleep 10
  done
done
