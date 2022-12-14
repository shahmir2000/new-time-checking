var express = require('express');
var router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// get all users
router.get('/', async (req, res, next) => {
  try {
    const products = await prisma.user.findMany({
      where: {
        OR: [
          { status: 'CURRENT' },
          { status: 'OVERTIME' },
          { status: 'HISTORIC' },
          { status: 'HISTORIC' }
        ]
      }
    });
    res.json(products);
  } catch (error) {
    next(error);
  }
});

//get by id
router.get('/data/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id.length !== 24) {
      return res.status(400).json({
        message: 'invalid user Id'
      });
    }
    const user = await prisma.user.findFirst({
      where: {
        id: id,
        OR: [
          { status: 'CURRENT' },
          { status: 'OVERTIME' },
          { status: 'HISTORIC' },
          { status: 'HISTORIC' }
        ]
      }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});
//create user

router.post('/create', async (req, res, next) => {
  try {
    const { name, checkinTime, currentTime, expectedCheckoutTime, package } =
      req.body;
    if (!name) {
      return res.status(400).json({
        message: 'enter name'
      });
    }
    if (!package) {
      return res.status(400).json({
        message: 'enter package'
      });
    }
    if (!checkinTime) {
      return res.status(400).json({
        message: 'enter checkinTime'
      });
    }
    if (!expectedCheckoutTime) {
      return res.status(400).json({
        message: 'enter expectedCheckoutTime'
      });
    }

    const user = await prisma.user.create({
      data: {
        currentTime,
        package,
        checkinTime,
        expectedCheckoutTime,
        name,
        status: 'CURRENT'
      }
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

//update status to overtime or historic
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { currentTime } = req.body;

    if (!currentTime) {
      return res.status(400).json({
        message: 'current time is missing'
      });
    }
    if (id.length !== 24) {
      return res.status(400).json({
        message: 'invalid user Id'
      });
    }
    const userExist = await prisma.user.findFirst({
      where: {
        id: id
      }
    });
    const fiveMinutes = 5 * 60;
    const fifteenMinutes = 15 * 60;
    const dayStartDate = userExist?.expectedCheckoutTime.getTime() / 1000;
    const entryTimeDate = new Date(currentTime).getTime() / 1000;

    if (dayStartDate + fifteenMinutes < entryTimeDate) {
      const user = await prisma.user.update({
        where: { id: id },
        data: {
          currentTime: currentTime,
          status: 'HISTORIC'
        }
      });
      res.json(user);
    } else if (dayStartDate + 1 < entryTimeDate) {
      const user = await prisma.user.update({
        where: { id: id },
        data: {
          currentTime: currentTime,
          status: 'OVERTIME'
        }
      });
      res.json(user);
    } else {
      const user = await prisma.user.update({
        where: { id: id },
        data: {
          currentTime: currentTime,
          status: 'CURRENT'
        }
      });
      res.json(user);
    }
  } catch (error) {
    next(error);
  }
});

router.patch('/complete/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { currentTime } = req.body;

    if (!currentTime) {
      return res.status(400).json({
        message: 'current time is missing'
      });
    }
    if (id.length !== 24) {
      return res.status(400).json({
        message: 'invalid user Id'
      });
    }
    const userExist = await prisma.user.findFirst({
      where: {
        id: id,
        OR: [{ status: 'CURRENT' }, { status: 'OVERTIME' }]
      }
    });
    if (!userExist) {
      return res.status(400).json({
        message: 'invalid user Id'
      });
    }
    const user = await prisma.user.update({
      where: { id: id },
      data: {
        currentTime: currentTime,
        status: 'COMPLETE'
      }
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

//get by id
router.delete('/delete/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id.length !== 24) {
      return res.status(400).json({
        message: 'invalid user Id'
      });
    }
    const userExist = await prisma.user.findFirst({
      where: {
        id,
        OR: [
          { status: 'COMPLETE' },
          { status: 'OVERTIME' },
          { status: 'CURRENT' }
        ]
      }
    });
    if (!userExist) {
      return res.status(400).json({
        message: 'user is not exist Id'
      });
    }
    const user = await prisma.user.update({
      where: { id },
      data: { status: 'DELETED' }
    });
    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});
module.exports = router;
