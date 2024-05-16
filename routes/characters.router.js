import express from 'express';
import joi from 'joi';
import Player from '../schemas/characters.schema.js';
import Item from '../schemas/item.schema.js';
import { validate } from 'uuid';

const router = express.Router();

const createdPlayerSchema = joi.object({
    Playername: joi.string().min(1).max(50).required(),
})

router.post('/characters', async (req, res, next) => {
    // 1. 클라이언트로 부터 받아온 name 데이터를 가져온다.
    const validation = await createdPlayerSchema.validateAsync(req.body);

    const {Playername} = validation

    // 1-5. 만약, value 데이터를 전달하지 않았을 때, 클라이언트에게 에러 메시지를 전달한다.
    if (!Playername) {
        return res.status(400).json({ errorMessage: "이름 값이 올바르지 않습니다." });
    }

    // 2. 해당하는 마지막 캐릭터ID 데이터를 조회한다.
    // findOne은 한개의 데이터만 조회한다.
    // sort 는 정렬한다 -> 어떤 컬럼을? -> order을 앞에 - 붙여서 내림차순으로 정렬한다
    // mongoose에서 await 작성하면 항상 exec() 사용
    const PlayerMaxOrder = await Player.findOne({},{_id:0,__v:0, health:0, power:0}).sort('-character_id').exec();

    // 3. 만약 존재한다면 현재 해야 할 일을 +1하고, order 데이터가 존재하지 않다면, 1로 할당
    const character_id = PlayerMaxOrder ? PlayerMaxOrder.character_id + 1 : 1;

    const health = 500;
    const power = 100;

    // 4. 캐릭터 정보 등록
    const player = new Player({ Playername, character_id, health, power });
    await player.save();

    // 5. 캐릭터 json에 반환
    return res.status(201).json({ Playername: Playername, character_id: character_id });

})

//아이템 추가
router.post('/items', async (req, res, next) => {
    // 1. 클라이언트로 부터 받아온 이름데이터와 스탯 데이터를 가져온다.
    const { item_name, item_stat } = req.body;
    // 1-5. 만약,  아이템 이름이나, 스탯 내용이 없을시 에러 발생
    if (!item_name || !item_stat) {
        return res.status(400).json({ errorMessage: "아이템 값이 올바르지 않습니다." });
    }

    // 2. 해당하는 마지막 아이템 데이터를 조회한다.
    // findOne은 한개의 데이터만 조회한다.
    // sort 는 정렬한다 -> 어떤 컬럼을? -> order을 앞에 - 붙여서 내림차순으로 정렬한다
    // mongoose에서 await 작성하면 항상 exec() 사용
    const ItemMaxOrder = await Item.findOne().sort('-item_code').exec();

    // 3. 만약 존재한다면 현재 해야 할 일을 +1하고, order 데이터가 존재하지 않다면, 1로 할당
    const item_code = ItemMaxOrder ? ItemMaxOrder.item_code + 1 : 1;

    // 4. 해야할 일 등록
    const item = new Item({ item_name: item_name, item_code: item_code, item_stat: item_stat });
    await item.save();

    // 5. 해야할 일을 클라이언트에게 반환한다.
    return res.status(201).json({ item_name: item_name, item_code: item_code, item_stat: item_stat });
})

router.get('/characters/:character_id', async (req, res, next) => {
    const { character_id } = req.params;
    // 현재 나의 order가 무엇인지 알아야한다.
    const nowPlayer = await Player.findOne({ character_id }).exec();
    if (!nowPlayer) {
        return res.status(404).json({ errorMessage: '존재하지 않는 플레이어 입니다' });
    }

    const PlayerNameData = nowPlayer.Playername;
    const PlayerHealthData = nowPlayer.health;
    const PlayerPowerData = nowPlayer.power;
    // 2. 세부정보 조회 결과를 넘긴다.
    return res.status(200).json({ Playername: PlayerNameData, health: PlayerHealthData, power: PlayerPowerData });
})

/* 아이템 목록 조회 API */
router.get('/items', async (req, res, next) => {
    // 1. 해야할 일 목록 조회를 진행한다.
    const items = await Item.find({}, { item_stat: 0, _id: 0, __v: 0 }).sort('-item_code').exec();


    // 2. 해야할 일 목록 조회 결과를 클라이언트에게 반환한다.
    return res.status(200).json({ items });
})

/* 아이템 상세 정보 조회 API */
router.get('/items/:item_code', async (req, res, next) => {
    const { item_code } = req.params;
    
    // 현재 나의 order가 무엇인지 알아야한다.
    const nowItem = await Item.findOne({ item_code }, { _id: 0, __v: 0, _id: 0 }).exec();
    if (!nowItem) {
        return res.status(404).json({ errorMessage: '존재하지 않는 플레이어 입니다' });
    }


    // 2. 세부정보 조회 결과를 넘긴다.
    return res.status(200).json({ nowItem });
})

//캐릭터 삭제 API
router.delete('/characters/:character_id', async (req, res, next) => {
    const { character_id } = req.params;

    const nowPlayer = await Player.findOne({ character_id }).exec();
    if (!nowPlayer) {
        return res.status(404).json({ errorMessage: '존재하지 않는 플레이어 입니다' });
    }

    await Player.deleteOne({ character_id });

    return res.status(200).json("캐릭터 " + nowPlayer.Playername +"을/를 삭제하셨습니다");
})

/* 아이템 정보값 변경 API */
router.patch('/items/:item_code', async (req, res, next) => {
    //item_code => params값
    const { item_code } = req.params;
    //입력값
    const { item_name, item_stat } = req.body;
    // 현재 나의 아이템이 무엇인지 확인
    const nowItem = await Item.findOne({item_code},{item_code:0, __v:0}).exec();
    if (!nowItem) {
        return res.status(404).json({ errorMessage: '존재하지 않는 아이템 값 입니다.' });
    }

    if (item_name) {
        nowItem.item_name = item_name;
    }

    if(item_stat) {
        nowItem.item_stat = item_stat; 
    }

    await nowItem.save();

    return res.status(200).json({nowItem});
});

//외부로 라우터 보내기
export default router;