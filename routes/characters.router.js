import express from 'express';
import joi from 'joi';
import Player from '../schemas/characters.schema.js';
import Item from '../schemas/item.schema.js';
import { validate } from 'uuid';

const router = express.Router();

const createdPlayerSchema = joi.object({
  Playername: joi.string().min(1).max(50).required(),
});

router.post('/characters', async (req, res, next) => {
  // 1. Ŭ���̾�Ʈ�� ���� �޾ƿ� name �����͸� �����´�.
  try {
    const validation = await createdPlayerSchema.validateAsync(req.body);

    const { Playername } = validation;

    // 1-5. ����, value �����͸� �������� �ʾ��� ��, Ŭ���̾�Ʈ���� ���� �޽����� �����Ѵ�.
    if (!Playername) {
      return res.status(400).json({ errorMessage: '�̸� ���� �ùٸ��� �ʽ��ϴ�.' });
    }

    // 2. �ش��ϴ� ������ ĳ����ID �����͸� ��ȸ�Ѵ�.
    // findOne�� �Ѱ��� �����͸� ��ȸ�Ѵ�.
    // sort �� �����Ѵ� -> � �÷���? -> order�� �տ� - �ٿ��� ������������ �����Ѵ�
    // mongoose���� await �ۼ��ϸ� �׻� exec() ���
    const PlayerMaxOrder = await Player.findOne(
      {},
      { _id: 0, __v: 0, health: 0, power: 0 }
    )
      .sort('-character_id')
      .exec();

    // 3. ���� �����Ѵٸ� ���� �ؾ� �� ���� +1�ϰ�, order �����Ͱ� �������� �ʴٸ�, 1�� �Ҵ�
    const character_id = PlayerMaxOrder ? PlayerMaxOrder.character_id + 1 : 1;

    const health = 500;
    const power = 100;

    // 4. ĳ���� ���� ���
    const player = new Player({ Playername, character_id, health, power });
    await player.save();

    // 5. ĳ���� json�� ��ȯ
    return res
      .status(201)
      .json({ Playername: Playername, character_id: character_id });
  } catch (error) {
    next(error);
  }
});

//������ �߰�
router.post('/items', async (req, res, next) => {
  // 1. Ŭ���̾�Ʈ�� ���� �޾ƿ� �̸������Ϳ� ���� �����͸� �����´�.
  const { item_name, item_stat } = req.body;
  // 1-5. ����,  ������ �̸��̳�, ���� ������ ������ ���� �߻�
  if (!item_name || !item_stat) {
    return res.status(400).json({ errorMessage: '������ ���� �ùٸ��� �ʽ��ϴ�.' });
  }

  // 2. �ش��ϴ� ������ ������ �����͸� ��ȸ�Ѵ�.
  // findOne�� �Ѱ��� �����͸� ��ȸ�Ѵ�.
  // sort �� �����Ѵ� -> � �÷���? -> order�� �տ� - �ٿ��� ������������ �����Ѵ�
  // mongoose���� await �ۼ��ϸ� �׻� exec() ���
  const ItemMaxOrder = await Item.findOne().sort('-item_code').exec();

  // 3. ���� �����Ѵٸ� ���� �ؾ� �� ���� +1�ϰ�, order �����Ͱ� �������� �ʴٸ�, 1�� �Ҵ�
  const item_code = ItemMaxOrder ? ItemMaxOrder.item_code + 1 : 1;

  // 4. �ؾ��� �� ���
  const item = new Item({
    item_name: item_name,
    item_code: item_code,
    item_stat: item_stat,
  });
  await item.save();

  // 5. �ؾ��� ���� Ŭ���̾�Ʈ���� ��ȯ�Ѵ�.
  return res
    .status(201)
    .json({ item_name: item_name, item_code: item_code, item_stat: item_stat });
});

router.get('/characters/:character_id', async (req, res, next) => {
  const { character_id } = req.params;
  // ���� ���� order�� �������� �˾ƾ��Ѵ�.
  const nowPlayer = await Player.findOne({ character_id }).exec();
  if (!nowPlayer) {
    return res.status(404).json({ errorMessage: '�������� �ʴ� �÷��̾� �Դϴ�' });
  }

  const PlayerNameData = nowPlayer.Playername;
  const PlayerHealthData = nowPlayer.health;
  const PlayerPowerData = nowPlayer.power;
  // 2. �������� ��ȸ ����� �ѱ��.
  return res.status(200).json({
    Playername: PlayerNameData,
    health: PlayerHealthData,
    power: PlayerPowerData,
  });
});

/* ������ ��� ��ȸ API */
router.get('/items', async (req, res, next) => {
  // 1. �ؾ��� �� ��� ��ȸ�� �����Ѵ�.
  const items = await Item.find({}, { item_stat: 0, _id: 0, __v: 0 })
    .sort('-item_code')
    .exec();

  // 2. �ؾ��� �� ��� ��ȸ ����� Ŭ���̾�Ʈ���� ��ȯ�Ѵ�.
  return res.status(200).json({ items });
});

/* ������ �� ���� ��ȸ API */
router.get('/items/:item_code', async (req, res, next) => {
  const { item_code } = req.params;

  // ���� ���� order�� �������� �˾ƾ��Ѵ�.
  const nowItem = await Item.findOne(
    { item_code },
    { _id: 0, __v: 0, _id: 0 }
  ).exec();
  if (!nowItem) {
    return res.status(404).json({ errorMessage: '�������� �ʴ� �÷��̾� �Դϴ�' });
  }

  // 2. �������� ��ȸ ����� �ѱ��.
  return res.status(200).json({ nowItem });
});

//ĳ���� ���� API
router.delete('/characters/:character_id', async (req, res, next) => {
  const { character_id } = req.params;

  const nowPlayer = await Player.findOne({ character_id }).exec();
  if (!nowPlayer) {
    return res.status(404).json({ errorMessage: '�������� �ʴ� �÷��̾� �Դϴ�' });
  }

  await Player.deleteOne({ character_id });

  return res
    .status(200)
    .json('ĳ���� ' + nowPlayer.Playername + '��/�� �����ϼ̽��ϴ�');
});

/* ������ ������ ���� API */
router.patch('/items/:item_code', async (req, res, next) => {
  //item_code => params��
  const { item_code } = req.params;
  //�Է°�
  const { item_name, item_stat } = req.body;
  // ���� ���� �������� �������� Ȯ��
  const nowItem = await Item.findOne(
    { item_code },
    { item_code: 0, __v: 0 }
  ).exec();
  if (!nowItem) {
    return res
      .status(404)
      .json({ errorMessage: '�������� �ʴ� ������ �� �Դϴ�.' });
  }

  if (item_name) {
    nowItem.item_name = item_name;
  }

  if (item_stat) {
    nowItem.item_stat = item_stat;
  }

  await nowItem.save();

  return res.status(200).json({ nowItem });
});

//�ܺη� ����� ������
export default router;
