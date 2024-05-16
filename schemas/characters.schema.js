import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
    Playername:{
        type:String,
        required : true,
        unique:true
    },
    character_id:{
        type:Number,
        required : true,
    },
    health:{
        type:Number,
    },
    power:{
        type:Number,
    },
})


// TodoSchema를 바탕으로 Todo모델을 생성하여, 외부로 내보냅니다.
export default mongoose.model('Player', PlayerSchema);