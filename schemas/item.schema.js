import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
    item_code:{
        type:Number,
        required:true,
    },
    item_name:{
        type:String,
        required:true,
        unique:true,
    },
    item_stat:{
        health : {
            type:Number,
            required:false,
        },
        power : {
            type:Number,
            required:false,
        }
    },

})

export default mongoose.model('Itemdata', ItemSchema);