const db_tools = require('./mongo_tools');
const {MongoClient} = require('mongodb');

const DAY_S = 24 * 60 * 60;
const DAY_MS = DAY_S * 1000;
const HOUR_MS = 60 * 60 * 1000;
const INTERVAL_S = 10 * 60;
const INTERVAL_MS = INTERVAL_S * 1000;

const max_temp = 73;
const min_temp = 12;

//nst hourly_weighting = [1, 2, 3, 4, 5, 6, 7, 8, 9 10, 11, 12, 13, 14 ,15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
const hourly_weighting = [1, 2, 1, 1, 1, 1, 2, 2, 5,  7,  8,  9, 10, 10, 10,  9,  7,  5,  5,  5,  5,  3,  2,  1]


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getValue(a_timestamp){
  var record_hour = a_timestamp.getHours();
  weighting = hourly_weighting[record_hour];

  const ceiling = (max_temp / 10) * weighting;
  var cpu_temp = min_temp + Math.floor(Math.random() * ceiling);

  console.log("TIME:" + a_timestamp + " HOUR:" + record_hour + " WEIGHTING:" + weighting + " CEILING:" + ceiling + " CPU Temp:" + cpu_temp);
  return cpu_temp;
}

async function run(){

  const uri = await db_tools.get_url();
  console.log("URI");
  console.log(uri);
  const client = new MongoClient(uri);

  try {
    const database = client.db(db_tools.DB_NAME);
    const metric_record = database.collection(db_tools.COLLECTION_NAME);
    var now = new Date();
    //var now_ms = now.getTime();

    //Remove all records 
//    metric_record.updateMany(
//      { },
//      { $unset: { cpuUsage: "" } }
//    )
    //const d_res = await metric_record.deleteMany({timestamp : {$gt : now_ms} })
    //const d_res = await metric_record.deleteMany({timestamp : {$gt : now} })
    //const d_res1 = await metric_record.deleteMany({"date": {$type: "string"}})
    //const d_res1 = await metric_record.deleteMany({})
    //console.log("Delete:" + d_res1.result.n);
//    const d_res2 = await metric_record.deleteMany({"$and": [{timestamp: {"$lt": now }}, { "cpuUsage": {$exists : true } }] })
//    console.log("Delete:" + d_res2.deletedCount);

    metric_record.deleteMany({"$and": [{timestamp: {"$lt": now }}, { "cpuTemp": {$exists : true } }]} , (err, d_res) => {
      if (err) throw err;
      console.log("Delete:" + d_res.deleteCount);
    })
    //console.log("Delete:" + d_res2.deletedCount);

//    metric_record.deleteMany({timestamp:{$lt : now}}, (err, d_res) => {
//      if (err) throw err;
//      console.log("Delete:" + d_res.result.n);
//    });


    //var yesterday = new Date(now_ms - DAY_MS);
    //var yesterday = new Date(now - DAY_S);
    var yesterday = new Date(now - DAY_MS);
    var date_record = yesterday;
    console.log("Yesterday:" + yesterday)

    while (date_record <= now){

      cpu_temp = await getValue(date_record); 
//      var record_hour = date_record.getHours();
//      weighting = hourly_weighting[record_hour];

 //     const ceiling = (max_cpu / 10) * weighting;
//      var cpu_usage = min_cpu + Math.floor(Math.random() * ceiling);
//      cpu_usage = (max_cpu / 10) * random_num;

      const doc = {
        timestamp: date_record,
        "cpuTemp": cpu_temp,
      }  

      const result = await metric_record.insertOne(doc);
      console.log(`A document was inserted with the _id: ${result.insertedId}` + " CPU Temp:" + cpu_temp);
      //date_record = new Date(date_record.getTime() + INTERVAL_MS);
	    
      date_record = new Date(date_record.getTime() + INTERVAL_MS);
      //date_record.setMinutes(date_record.getMinutes() + 10);
      //console.log("DATE:" + date_record)
    }

    while (true) {
       console.log("Sleeping for " + INTERVAL_MS)
       await sleep(INTERVAL_MS);
       var right_now = new Date();
       cpu_temp = await getValue(right_now);
       const doc = {
         timestamp: right_now,
         "cpuUsage": cpu_temp,
       }  

       const result = await metric_record.insertOne(doc);
       console.log(`A document was inserted with the _id: ${result.insertedId}` + " CPU Temp:" + cpu_temp);
    }

  } finally {
    await client.close();
  }
}
run().catch(console.dir);
