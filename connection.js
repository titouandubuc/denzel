require ('dotenv').config()
const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const imdb = require('./src/imdb');
const DENZEL_IMDB_ID = 'nm0000243';


const CONNECTION_URL ="mongodb+srv://titou:titou@denzel-6qgwa.gcp.mongodb.net/test?retryWrites=tru";
const DATABASE_NAME = "Denzel";

var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database, collection;

app.listen(9292, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("movies");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

app.get("/movies/search",async (request, response) => {
	var metascore= request.query.metascore;
	var limit= request.query.limit;
	if(limit==undefined) limit=5;
	if(metascore==undefined) metascore=0;
	var query1 = await {metascore:{$gte:Number(metascore) }};
	var sample = await {size: Number(limit)};
	collection.aggregate([{$match: query1 },{$sample: sample} ,{$sort:{"metascore":-1}}]).toArray((error,result)=>{
		 if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
	});

});

app.get("/movies/populate", async (request, response) => {
	const movies= await imdb(DENZEL_IMDB_ID)
    collection.insert( movies, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});

app.get("/movies",async (request, response) => {
	var query={metascore:{$gt:70}};
	var n =await collection.countDocuments(query);
	var r = await Math.floor(Math.random() * n);
	collection.find(query).limit(1).skip(r).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});


app.get("/movies/:id", (request, response) => {
    collection.findOne({"id": request.params.id}, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});

app.post("/movies/:id", (request, response) => {
	var date = request.body.date;
	var review= request.body.review;
	collection.updateOne({"id":request.params.id},{$set:{
		"date": date,
		"review": review
		}
	},(error, result) => {
	  if(error) {
		return response.status(500).send(error);
	}
	response.send(result);
});
});
   





