let express = require("express"); 
let app = express();
app.listen(8080);
console.log("Niklas API körs på port 8080");

app.use(express.urlencoded({ extended: true })); 

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/main.html");
});

const mysql = require("mysql");
  databas = mysql.createConnection({
  host: "localhost", 
  user: "root", 
  password: "", 
  database: "niklasforum", 
  multipleStatements: true, 
});

const crypto = require("crypto"); 
function hash(data) {
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
}
  
const tokenverktyg = require("jsonwebtoken"); 
app.post("/login", function (req, res) {
  console.log(req.body);
  if (!(req.body && req.body.username && req.body.password)) {
    res.sendStatus(400);
    return;
  }
  app.get("/login", function (req, res) {
  let sqlbas = `SELECT * FROM users WHERE username='${req.body.username}'`;

  databas.query(sqlbas, function (err, result, fields) {
    if (err) throw err;
    if (result.length == 0) {
      res.sendStatus(401);
      return;
    }
    let passwordHash = hash(req.body.password);
    console.log(passwordHash);
    console.log(result[0].password);
    if (result[0].password == passwordHash) {
      res.send({
        
        name: result[0].name,
        username: result[0].username,
       
      });
    } else {
      res.sendStatus(401);
    }
  });
});
  
app.get("/users", function (req, res) {

  let authHeader = req.headers["authorization"];
  if (authHeader === undefined) {
    res.sendStatus(400); 
    return;
  }
  let token = authHeader.slice(7); 
  
  console.log(token);

  let decoded;
  try {
    decoded = jwt.verify(token, "EkkorenSattiTaket12=%%");
  } catch (err) {
    console.log(err); 
    res.status(401).send("Invalid auth token");
    return;
  }

  console.log(decoded);
  console.log(`Halloj! ${decoded.name}! Din mejladress är ${decoded.email}.`);

  app.get("/users", function (req, res) {
  let sqlbas = "SELECT * FROM niklasforum"; 
  console.log(sqlbas);
 
  databas.query(sqlbas, function (err, result, fields) {
    res.send(result);
  });
  });
});

const ANVANDARE = ["id", "username", "password", "name"]; 

app.get("/users", function (req, res) {
  let sqlbas = "SELECT * FROM niklasforum";
 let condition = createCondition(req.query);
  console.log(sqlbas + condition);
  databas.query(sqlbas + condition, function (err, result, fields) {
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

});
app.get("/users/:id", function (req, res) {
  let sqlbas = "SELECT * FROM niklasforum WHERE id=" + req.params.id;
  console.log(sqlbas);
  databas.query(sqlbas, function (err, result, fields) {
    if (result.length > 0) {
      res.send(result);
    } else {
      res.sendStatus(404);
    }
  });
});

app.use(express.json());


app.post("/users", function (req, res) {
  if (!req.body.username) {
    res.status(400).send("username required!");
    return;
  }
  let fields = ["username", "password", "name"];
  for (let key in req.body) {
    if (!fields.includes(key)) {
      res.status(400).send("Unknown field: " + key);
      return; 
    }
  }

  let sqlbas = `INSERT INTO niklasforum (username, name, password)
    VALUES ('${req.body.username}', 
    '${req.body.name}',
    '${hash(req.body.password)}');
    SELECT LAST_INSERT_ID();`; 
  console.log(sqlbas);
  
databas.query(sqlbas, function (err, result, fields) {
    if (err) throw err;
    console.log(result);
    let output = {
      id: result[0].insertId,
      name: req.body.name,
      username: req.body.username,    
    }; 
  
    res.send(output);  
  }); 
});

app.put("/users/:id", function (req, res) {
  if (!(req.body && req.body.name && req.body.password)) {
    res.sendStatus(400);
    return;
  }
  let sqlbas = `UPDATE niklasforum 
        SET name = '${req.body.name}',password = '${hash(req.body.password)}'
        WHERE id = ${req.params.id}`;

        databas.query(sqlbas, function (err, result, fields) {
    if (err) {
      throw err;
    } else {
      res.sendStatus(200);
    }
    });
  });

   app.delete("/users/:id", (req,res) => {
    try{
      const {id} = req.params;
      const deleteUser =  User.findByIdAndDelete(id);
      if(!deleteUser) {
        return res.status(404).json({message: `Kan inte hitta andvändaren med ID ${id}`})
      }
      res.status(200).json(deleteUser);
    } catch (error) {
      res.status(500).json({message: error.message})
    }
  }) 