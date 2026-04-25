// 用户管理辅助函数

// 验证用户是否过期
async function validateUserExpiration(env, userId) {
  try {
    // 从KV存储中获取用户信息
    const userRecord = await env.USERS_KV.get(userId);
    if (!userRecord) {
      console.log(`用户不存在: ${userId}`);
      return { valid: false, message: '用户不存在' };
    }
    
    const user = JSON.parse(userRecord);
    const now = Date.now();
    
    // 检查用户是否过期
    if (user.expiration && now > user.expiration) {
      console.log(`用户已过期: ${userId}, 过期时间: ${new Date(user.expiration).toISOString()}`);
      return { valid: false, message: '用户账户已过期' };
    }
    
    console.log(`用户有效: ${userId}, 到期时间: ${user.expiration ? new Date(user.expiration).toISOString() : '永久'}`);
    return { valid: true, user: user };
  } catch (error) {
    console.error('验证用户过期时出错:', error);
    return { valid: false, message: '验证用户时发生错误' };
  }
}

// 创建新用户
async function createUser(env, userId, days) {
  try {
    const expiration = days > 0 ? Date.now() + (days * 24 * 60 * 60 * 1000) : null;
    const user = {
      id: userId,
      created: Date.now(),
      expiration: expiration,
      days: days
    };
    
    await env.USERS_KV.put(userId, JSON.stringify(user));
    return { success: true, user: user };
  } catch (error) {
    console.error('创建用户时出错:', error);
    return { success: false, message: '创建用户时发生错误' };
  }
}

// 更新用户（续期）
async function updateUser(env, userId, days) {
  try {
    const userRecord = await env.USERS_KV.get(userId);
    if (!userRecord) {
      return { success: false, message: '用户不存在' };
    }
    
    const user = JSON.parse(userRecord);
    const newExpiration = days > 0 ? Date.now() + (days * 24 * 60 * 60 * 1000) : null;
    
    user.expiration = newExpiration;
    user.days = days;
    user.updated = Date.now();
    
    await env.USERS_KV.put(userId, JSON.stringify(user));
    return { success: true, user: user };
  } catch (error) {
    console.error('更新用户时出错:', error);
    return { success: false, message: '更新用户时发生错误' };
  }
}

// 删除用户
async function deleteUser(env, userId) {
  try {
    await env.USERS_KV.delete(userId);
    return { success: true };
  } catch (error) {
    console.error('删除用户时出错:', error);
    return { success: false, message: '删除用户时发生错误' };
  }
}

// 获取所有用户
async function getAllUsers(env) {
  try {
    const keys = await env.USERS_KV.list();
    const users = [];
    
    for (const key of keys.keys) {
      const userRecord = await env.USERS_KV.get(key.name);
      if (userRecord) {
        const user = JSON.parse(userRecord);
        user.expirationDate = user.expiration ? new Date(user.expiration).toISOString() : null;
        users.push(user);
      }
    }
    
    return { success: true, users: users };
  } catch (error) {
    console.error('获取用户列表时出错:', error);
    return { success: false, message: '获取用户列表时发生错误' };
  }
}

// 生成用户ID
function generateUserId() {
  return 'user_' + Math.random().toString(36).substr(2, 9);
}