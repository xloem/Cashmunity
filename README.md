# Cashmunity

Lightweight backend that scans Bitcoin Cash blocks for specific protocol transactions and normalizes them.

Protocols currently supported:
Memo          (as of May 7th 2018)
Blockpress    (as of May 7th 2018)

# Prerequisites

- Bitcoin node (ABC, Unlimited, etc)

# Run

```
npm install

cp config.example.yaml config.yaml

# Edit config.yaml

npm start

# Wait until fully synced
# Visit http://localhost:8081/top
```

# Endpoints

```
GET:
/messages/:address
/replies/:replytx
/likes/:address
/name/:address
/follows/:address
/feed/:address
/top

POST:
/post    { tx: 'hexstring' }
```

# Notes

As of May 7th 2018 it takes only 5 minutes to fully sync all messages to a sqlite database using a local Bitcoin node.

# Tip jar

bitcoincash:qq6zhhvc8wy90a306d8py4eqd49rcu58qvr04xee5y
