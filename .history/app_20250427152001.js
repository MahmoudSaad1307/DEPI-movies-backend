const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const usersRoute = require("./routes/users");
const reviewsRoute = require("./routes/reviews");
const userListRoute = require("./routes/user-list");
// const reviewsInteractionRoute = require("./routes/review-interactions");

const app = express();
app.use(bodyParser.json());

mongoose
  .connect("mongodb+srv://Malik:Malik20@cluster0.49odtnt.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use("/api/users", usersRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/reviews", reviewsRoute);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
