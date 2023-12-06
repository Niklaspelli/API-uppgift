const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mysql = require("mysql");
console.log("Niklas API körs på port 8080");

app.listen(8080);
app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/main.html");
});

const databas = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "niklasforum",
  multipleStatements: true,
});

app.use(express.json());

app.use((request, response, next) => {
  console.log(
    `[${new Date().toLocaleString()}] [USER-IP ${request.ip}] ${
      request.method
    } ${request.url} `
  );
  next();
});

app.get("/users/:id", function (req, res) {
  let sql = "SELECT * FROM niklasforum WHERE id=" + req.params.id;
  console.log(sql);

  let authHeader = req.headers["authorization"];
  if (authHeader === undefined) {
    res.sendStatus("400");
    return;
  }
  let token = authHeader.slice(7);

  console.log(token);

  let decoded;
  try {
    decoded = jwt.verify(token, "Ekorrensattigranen12%%");
  } catch (err) {
    console.log(err);
    res.status(401).send("Invalid auth token");
    return;
  }

  console.log(decoded);
  console.log(`Hallojsan! ${req.body.username}! Ditt namn är ${decoded.name}.`);

  databas.query(sql, function (err, result, fields) {
    if (result.length > 0) {
      res.send(result);
    } else {
      res.sendStatus(404);
    }
  });
});

const ANVANDARE = ["id", "username", "password", "name"];

app.get("/users", function (req, res) {
  let sql = "SELECT * FROM niklasforum";
  let authHeader = req.headers["authorization"];
  if (authHeader === undefined) {
    res.sendStatus("400");
    return;
  }
  let token = authHeader.slice(7);

  console.log(token);

  let decoded;
  try {
    decoded = jwt.verify(token, "Ekorrensattigranen12%%");
  } catch (err) {
    console.log(err);
    res.status(401).send("Invalid auth token");
    return;
  }
  console.log(sql);
  console.log(decoded);
  console.log(
    `Hallojsan användare ${req.body.username}! Ditt riktiga namn är ${decoded.name}.`
  );

  let condition = createCondition(req.query);
  console.log(sql + condition);
  databas.query(sql, function (err, result, fields) {
    res.send(result);
  });
});

let createCondition = function (query) {
  console.log(query);
  let output = " WHERE ";
  for (let key in query) {
    if (ANVANDARE.includes(key)) {
      output += `${key}="${query[key]}" OR `;
    }
  }
  if (output.length == 7) {
    return "";
  } else {
    return output.substring(0, output.length - 4);
  }
};

function hash(data) {
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
}
app.post("/users", function (req, res) {
  if (!req.body.username) {
    res.status(400).send("Användarnamn behövs!");
    return;
  }
  if (!req.body.name) {
    res.status(400).send("Namn behövs!");
    return;
  }
  if (!req.body.password) {
    res.status(400).send("Lösenord behövs!");
    return;
  }
  let fields = ["username", "password", "name"];
  for (let key in req.body) {
    if (!fields.includes(key)) {
      res.status(400).send("Okänd information: " + key);
      return;
    }
  }

  let addUser = `INSERT INTO niklasforum (username, password, name)
      VALUES ('${req.body.username}', 
      '${hash(req.body.password)}',
      '${req.body.name}');
      SELECT LAST_INSERT_ID();`;
  console.log(addUser);

  databas.query(addUser, function (err, result, fields) {
    if (err) throw err;

    console.log(result);
    let output = {
      id: result[0].insertId,
      username: req.body.username,
      name: req.body.name,
    };
    res.send(output);
  });
});

app.post("/login", function (req, res) {
  let sql = `SELECT * FROM niklasforum WHERE username='${req.body.username}'`;

  databas.query(sql, function (err, result, fields) {
    if (err) throw err;
    if (result.length == 0) {
      res.status(400).send("Användarnamn finns ej!");
      return;
    }
    let passwordHash = hash(req.body.password);
    console.log(passwordHash);
    console.log(result[0].password);
    if (result[0].password == passwordHash) {
      let payload = {
        sub: result[0].username,
        name: result[0].name,
      };
      let token = jwt.sign(payload, "Ekorrensattigranen12%%");
      res.json(token);
    } else {
      res.status(400).send("Fel lösenord!");
    }
  });
});

app.put("/users/:id", function (req, res) {
  if (!(req.body && req.body.name && req.body.password)) {
    res.sendStatus(400);
    return;
  }
  let changeUser = `UPDATE niklasforum 
        SET name = '${req.body.name}',password = '${hash(req.body.password)}'
        WHERE id = ${req.params.id}`;

  databas.query(changeUser, function (err, result, fields) {
    if (err) {
      res.status(400).send("Något gick fel!");
      throw err;
    } else {
      res.status(200).send("Allt gick galant!");
    }
  });
});

app.delete("/deleteuser/:id", function (request, response) {
  const profileID = request.params.id;

  if (!profileID) {
    return response.status(400).send("Något gick fel!");
  }
  const deleteProfile = "DELETE FROM niklasforum WHERE id = ? ";
  const value = [profileID];

  databas.query(deleteProfile, value, function (err, result, fields) {
    if (err) {
      console.error("Error with query", err);
      response.status(500).send("Server Error");
    } else {
      response.send("Användaren är nu raderad ur Niklasforum.");
    }
  });
});
