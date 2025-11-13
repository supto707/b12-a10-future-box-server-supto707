const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // await client.connect();
    const db = client.db('localFoodLovers');
    const reviewsCollection = db.collection('reviews');
    const favoritesCollection = db.collection('favorites');

    // Get all reviews with search
    app.get('/reviews', async (req, res) => {
      const { search } = req.query;
      const query = search ? { foodName: { $regex: search, $options: 'i' } } : {};
      const reviews = await reviewsCollection.find(query).sort({ date: -1 }).toArray();
      res.send(reviews);
    });

    // Get top 6 reviews
    app.get('/reviews/featured', async (req, res) => {
      const reviews = await reviewsCollection.find().sort({ rating: -1 }).limit(6).toArray();
      res.send(reviews);
    });

    // Get single review
    app.get('/reviews/:id', async (req, res) => {
      const review = await reviewsCollection.findOne({ _id: new ObjectId(req.params.id) });
      res.send(review);
    });

    // Get reviews by user email
    app.get('/my-reviews/:email', async (req, res) => {
      const reviews = await reviewsCollection.find({ userEmail: req.params.email }).toArray();
      res.send(reviews);
    });

    // Add review
    app.post('/reviews', async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    // Update review
    app.put('/reviews/:id', async (req, res) => {
      const { _id, ...updateData } = req.body;
      const result = await reviewsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: updateData }
      );
      res.send(result);
    });

    // Delete review
    app.delete('/reviews/:id', async (req, res) => {
      const result = await reviewsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      res.send(result);
    });

    // Get favorites by user email
    app.get('/favorites/:email', async (req, res) => {
      const favorites = await favoritesCollection.find({ userEmail: req.params.email }).toArray();
      res.send(favorites);
    });

    // Add to favorites
    app.post('/favorites', async (req, res) => {
      const favorite = req.body;
      const existing = await favoritesCollection.findOne({
        userEmail: favorite.userEmail,
        reviewId: favorite.reviewId
      });
      if (existing) {
        return res.send({ message: 'Already in favorites' });
      }
      const result = await favoritesCollection.insertOne(favorite);
      res.send(result);
    });

    // Delete favorite
    app.delete('/favorites/:id', async (req, res) => {
      const result = await favoritesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      res.send(result);
    });

    console.log("Connected to MongoDB!");
    console.log("Database:", db.databaseName);
    const count = await reviewsCollection.countDocuments();
    console.log("Total reviews:", count);
  } catch (error) {
    console.error(error);
  }
}

run();

app.get('/', (req, res) => {
  res.send('Local Food Lovers Network Server Running');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
