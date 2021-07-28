const { connect } = require("mongoose");
const dotenv = require('dotenv').config();
const db = process.env.MONGOLAB_URI;

exports.connection = async(app) => {
  await connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });

  const port = process.env.PORT || 3008;
  app.listen(port, () => {
    console.log(`conntected on port ${port}`);
  });
  console.log("DB connetion successfulll!");
}

// connection();