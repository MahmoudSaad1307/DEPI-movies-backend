const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const usersRoute = require("./routes/users");
const reviewsRoute = require("./routes/reviews");

const app = express();
app.use(bodyParser.json());

mongoose
  .connect("mongodb://localhost:27017/movies", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use("/api/users", usersRoute);
app.use("/api/reviews", reviewsRoute);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
