const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//connect with Mongoose
mongoose.connect('mongodb+srv://aditya:nnBDch5g3ZS7BFQt@cluster0.mhgwz8o.mongodb.net/fcc_mongodb?retryWrites=true&w=majority&appName=Cluster0', 
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connected to MongoDB successfully!');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

//Mongoose Models
const Schema = mongoose.Schema;
const userSchema = new Schema({
  username: {type: String , required : true}
});
const User = mongoose.model('User', userSchema);
const exerciseSchema = new Schema({
  userid: {type: mongoose.Schema.Types.ObjectId, ref:'User' , required : true},
  description: {type: String , required : true},
  duration: {type: Number , required : true},
  date: {type: Date , required : true}
});
const Exercise = mongoose.model('Exercise', exerciseSchema);


//post api create new user
app.post ('/api/users', async(req, res)=> {
  try{
    const user = new User({username : req.body.username});
    const saved = await user.save();
    res.json({username : saved.username, _id:saved._id});
  } catch(err){
    res.status(500).send(err.message);
  }
})

//get user id information
app.get ('/api/users',async(req, res) =>{
  const users = await User.find().select('_id username');
  res.json(users);
})

//post exercise data for a user
app.post('/api/users/:_id/exercises', async(req,res) => {
  try{
    const {description, duration, date} =req.body;
    const user = await User.findById(req.params._id);
    if (!user) return res.status(400).send('User not found');
    const exercise = new Exercise ({
      userid: user._id,
      description : description,
      duration : parseInt(duration),
      date : date ? new Date(date) : new Date()
    });
    const savedExercise = await exercise.save();
    console.log('Saved exercise:', savedExercise);
    res.json({
      _id: user._id,
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: savedExercise.date.toDateString(),
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
  });

//get exercise logs
app.get('/api/users/:_id/logs', async (req,res) => {
  const {from, to , limit} = req.query;
  const user = await User.findById(req.params._id);
  if (!user) return res.status(400).send('User not found');

  let filter = {userid: mongoose.Types.ObjectId(user._id)};

  if(from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date (to);
  };

  let query = Exercise.find(filter).select('description duration date');
  if (limit) query = query.limit(parseInt(limit));

  const exercises = await query.exec();

  console.log(exercises);

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log: exercises.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString(),
    })),
  });

});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
