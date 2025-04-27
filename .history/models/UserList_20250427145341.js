const mongoose=require('mongoose')

const UserListSchema=new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
ditle:String,
movies:[Number],




})