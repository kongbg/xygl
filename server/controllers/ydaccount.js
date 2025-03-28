import YdAccountModel from '../models/ydaccount.js';
import YdglTool from '../utils/ydgltool.js';

// 获取账号列表
export const getAccounts = async (ctx) => {
  const accounts = await YdAccountModel.getAll();
  // 过滤掉已删除的账号
  const activeAccounts = accounts.filter(account => account.delFlag === 0);
  ctx.body = ctx.pagination.paginate(activeAccounts);
};

// 添加账号
export const addAccount = async (ctx) => {
  const { username, password } = ctx.request.body;
  if (!username || !password) {
    ctx.throw(400, '用户名和密码不能为空');
  }

  // 检查账号是否已存在
  const accounts = await YdAccountModel.getAll();
  const existingAccount = accounts.find(a => a.username === username && a.delFlag === 0);
  if (existingAccount) {
    ctx.throw(400, '该账号已存在');
  }

  try {
    // 获取key
    const key = await YdglTool.getKey();
    
    // 登录获取token
    const result = await YdglTool.login(username, password, key);

    if (result.status === 101) {
      // 返回二维码
      ctx.body = {
        needQrCode: true,
        qrCode: result.qrCode,
        instanceId: result.instanceId
      };
      return;
    }

    const account = await YdAccountModel.add({ 
      username, 
      password,
      token: result.token,
      expires_time: result.expires_time,
      isBind: true
    });
    ctx.body = account;
  } catch (error) {
    ctx.throw(500, `账号注册失败: ${error.message}`);
  }
};

// 更新账号
export const updateAccount = async (ctx) => {
  const { id } = ctx.params;
  const updates = ctx.request.body;

  // 如果要更新用户名，检查是否与其他账号冲突
  if (updates.username) {
    const accounts = await YdAccountModel.getAll();
    const existingAccount = accounts.find(
      a => a.username === updates.username && 
      a.id !== id && 
      a.delFlag === 0
    );
    if (existingAccount) {
      ctx.throw(400, '该账号已存在');
    }
  }

  const account = await YdAccountModel.update(id, updates);
  if (account) {
    ctx.body = account;
  } else {
    ctx.throw(404, '账号不存在');
  }
};

// 删除账号
export const deleteAccount = async (ctx) => {
  const { id } = ctx.params;
  const account = await YdAccountModel.delete(id);
  if (account) {
    ctx.body = account;
  } else {
    ctx.throw(404, '账号不存在');
  }
};

// 获取单个账号
export const getAccount = async (ctx) => {
  const { id } = ctx.params;
  const account = await YdAccountModel.getById(id);
  if (account) {
    ctx.body = account;
  } else {
    ctx.throw(404, '账号不存在');
  }
};

// 更新账号状态
export const updateStatus = async (ctx) => {
  const { id } = ctx.params;
  const { status } = ctx.request.body;
  
  if (typeof status !== 'number' || ![0, 1].includes(status)) {
    ctx.throw(400, '无效的状态值');
  }

  const account = await YdAccountModel.update(id, { status });
  if (account) {
    ctx.body = account;
  } else {
    ctx.throw(404, '账号不存在');
  }
};

// 更新账号绑定状态
export const updateBindStatus = async (ctx) => {
  const { id } = ctx.params;
  const { isBind, token } = ctx.request.body;

  const account = await YdAccountModel.update(id, { 
    isBind: isBind === true || isBind === 'true',
    token: token || ''
  });
  
  if (account) {
    ctx.body = account;
  } else {
    ctx.throw(404, '账号不存在');
  }
};

// 刷新token
export const refreshToken = async (ctx) => {
  const { id } = ctx.params;
  const account = await YdAccountModel.getById(id);
  
  if (!account) {
    ctx.throw(404, '账号不存在');
  }
  
  try {
    const key = await YdglTool.getKey();
    const { token, expires_time } = await YdglTool.login(account.username, account.password, key);
    
    const updatedAccount = await YdAccountModel.update(id, { 
      token,
      expires_time,
      isBind: true
    });
    
    ctx.body = updatedAccount;
  } catch (error) {
    ctx.throw(500, `刷新token失败: ${error.message}`);
  }
};

// 检查扫码状态
export const checkScanStatus = async (ctx) => {
  const { instanceId } = ctx.params;
  
  if (!browserInstances.has(instanceId)) {
    ctx.throw(404, '二维码已过期');
  }
  
  const instance = browserInstances.get(instanceId);
  ctx.body = {
    scanned: instance.scanSuccess || false
  };
}; 