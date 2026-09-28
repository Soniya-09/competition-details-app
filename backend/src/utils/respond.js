const send = (res, data, status = 200) => res.status(status).json({ data, serverTime: new Date().toISOString() });

module.exports = { send };
