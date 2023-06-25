module.exports = {
//export default {

  DB_NAME         : "trafficDB",
  COLLECTION_NAME : "traffic",

  get_url: function () {
    let uri;
//    const prom = new Promise((resolve, reject) => {
      const mongodb_user = process.env.MONGODB_USER;
      const mongodb_password = process.env.MONGODB_PASSWORD;
      const mongodb_uri = process.env.MONGODB_URI;
  
//      mongodb_user.then(mongodb_password.then

//      mongodb_user.then(); 

      //return uri = "mongodb+srv://"+ mongodb_user+":" + mongodb_password+ "@"+ mongodb_uri + "/test?retryWrites=true&w=majority";
      uri = "mongodb+srv://"+ mongodb_user+":" + mongodb_password+ "@"+ mongodb_uri + "/test?retryWrites=true&w=majority";
    console.log("URI:" + uri); 
      return uri;
  },
  bar: function () {
    // whatever
  }
};

