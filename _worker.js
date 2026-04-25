const Version = '2026-04-17 01:57:56';
import { connect } from 'cloudflare:sockets';

let config_JSON, 反代IP = '', 启用SOCKS5反代 = null, 启用SOCKS5全局反代 = false, 我的SOCKS5账号 = '', parsedSocks5Address = {};
let 缓存反代IP, 缓存反代解析数组, 缓存反代数组索引 = 0, 启用反代兜底 = true, 调试日志打印 = false;
let SOCKS5白名单 = ['*tapecontent.net', '*cloudatacdn.com', '*loadshare.org', '*cdn-centaurus.com', 'scholar.google.com'];
const Pages静态页面 = 'https://edt-pages.github.io';

// 用户管理相关常量
const USER_EXPIRATION_DAYS_DEFAULT = 30; // 默认用户使用天数

export default {
	async fetch(request, env, ctx) {
		const url = new URL(修正请求URL(request.url));
		const UA = request.headers.get('User-Agent') || 'null';
		const upgradeHeader = (request.headers.get('Upgrade') || '').toLowerCase(), contentType = (request.headers.get('content-type') || '').toLowerCase();
		const 管理员密码 = env.ADMIN || env.admin || env.PASSWORD || env.password || env.pswd || env.TOKEN || env.KEY || env.UUID || env.uuid;
		const 加密秘钥 = env.KEY || '勿动此默认密钥，有需求请自行通过添加变量KEY进行修改';
		const userIDMD5 = await MD5MD5(管理员密码 + 加密秘钥);
		const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
		const envUUID = env.UUID || env.uuid;
		const userID = (envUUID && uuidRegex.test(envUUID)) ? envUUID.toLowerCase() : [userIDMD5.slice(0, 8), userIDMD5.slice(8, 12), '4' + userIDMD5.slice(13, 16), '8' + userIDMD5.slice(17, 20), userIDMD5.slice(20)].join('-');
		const hosts = env.HOST ? (await 整理成数组(env.HOST)).map(h => h.toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0]) : [url.hostname];
		const host = hosts[0];
		const 访问路径 = url.pathname.slice(1).toLowerCase();
		调试日志打印 = ['1', 'true'].includes(env.DEBUG) || 调试日志打印;
		if (env.PROXYIP) {
			const proxyIPs = await 整理成数组(env.PROXYIP);
			反代IP = proxyIPs[Math.floor(Math.random() * proxyIPs.length)];
			启用反代兜底 = false;
		} else 反代IP = (request.cf.colo + '.PrOxYIp.CmLiUsSsS.nEt').toLowerCase();
		const 访问IP = request.headers.get('CF-Connecting-IP') || request.headers.get('True-Client-IP') || request.headers.get('X-Real-IP') || request.headers.get('X-Forwarded-For') || request.headers.get('Fly-Client-IP') || request.headers.get('X-Appengine-Remote-Addr') || request.headers.get('X-Cluster-Client-IP') || '未知IP';
		if (env.GO2SOCKS5) SOCKS5白名单 = await 整理成数组(env.GO2SOCKS5);
		if (访问路径 === 'version' && url.searchParams.get('uuid') === userID) {// 版本信息接口
			return new Response(JSON.stringify({ Version: Number(String(Version).replace(/\D+/g, '')) }), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
		} else if (管理员密码 && upgradeHeader === 'websocket') {// WebSocket代理
			await 反代参数获取(url);
			log(`[WebSocket] 命中请求: ${url.pathname}${url.search}`);
			return await 处理WS请求(request, userID, url);
		} else if (管理员密码 && !访问路径.startsWith('admin/') && 访问路径 !== 'login' && request.method === 'POST') {// gRPC/XHTTP代理
			await 反代参数获取(url);
			const referer = request.headers.get('Referer') || '';
			const 命中XHTTP特征 = referer.includes('x_padding', 14) || referer.includes('x_padding=');
			if (!命中XHTTP特征 && contentType.startsWith('application/grpc')) {
				log(`[gRPC] 命中请求: ${url.pathname}${url.search}`);
				return await 处理gRPC请求(request, userID);
			}
			log(`[XHTTP] 命中请求: ${url.pathname}${url.search}`);
			return await 处理XHTTP请求(request, userID);
		} else {
			if (url.protocol === 'http:') return Response.redirect(url.href.replace(`http://${url.hostname}`, `https://${url.hostname}`), 301);
			if (!管理员密码) return fetch(Pages静态页面 + '/noADMIN').then(r => { const headers = new Headers(r.headers); headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); headers.set('Pragma', 'no-cache'); headers.set('Expires', '0'); return new Response(r.body, { status: 404, statusText: r.statusText, headers }) });
			if (env.KV && typeof env.KV.get === 'function') {
				const 区分大小写访问路径 = url.pathname.slice(1);
				if (区分大小写访问路径 === 加密秘钥 && 加密秘钥 !== '勿动此默认密钥，有需求请自行通过添加变量KEY进行修改') {//快速订阅
					const params = new URLSearchParams(url.search);
					params.set('token', await MD5MD5(host + userID));
					return new Response('重定向中...', { status: 302, headers: { 'Location': `/sub?${params.toString()}` } });
				} else if (访问路径 === 'login') {//处理登录页面和登录请求
					const cookies = request.headers.get('Cookie') || '';
					const authCookie = cookies.split(';').find(c => c.trim().startsWith('auth='))?.split('=')[1];
					if (authCookie == await MD5MD5(UA + 加密秘钥 + 管理员密码)) return new Response('重定向中...', { status: 302, headers: { 'Location': '/admin' } });
					if (request.method === 'POST') {
						const formData = await request.text();
						const params = new URLSearchParams(formData);
						const 输入密码 = params.get('password');
						if (输入密码 === 管理员密码) {
							// 密码正确，设置cookie并返回成功标记
							const 响应 = new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
							响应.headers.set('Set-Cookie', `auth=${await MD5MD5(UA + 加密秘钥 + 管理员密码)}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Strict`);
							return 响应;
						}
					}
					// 返回原始项目的登录页面
					return fetch(Pages静态页面 + '/login');
				} else if (访问路径 === 'admin' || 访问路径.startsWith('admin/')) {//验证cookie后响应管理页面
					const cookies = request.headers.get('Cookie') || '';
					const authCookie = cookies.split(';').find(c => c.trim().startsWith('auth='))?.split('=')[1];
					// 没有cookie或cookie错误，跳转到/login页面
					if (!authCookie || authCookie !== await MD5MD5(UA + 加密秘钥 + 管理员密码)) return new Response('重定向中...', { status: 302, headers: { 'Location': '/login' } });
					
					// 检查是否是我们新增的用户管理API请求
					if (访问路径 === 'admin/users/create') { // 创建用户
						try {
							const userData = await request.json();
							const userId = userData.userId || userID; // 使用传入的userId或默认的userID
							const days = userData.days || USER_EXPIRATION_DAYS_DEFAULT;

							const result = await createUser(env, userId, days);
							if (result.success) {
								return new Response(JSON.stringify({ success: true, message: '用户创建成功', user: result.user }), {
									status: 200,
									headers: { 'Content-Type': 'application/json;charset=utf-8' }
								});
							} else {
								return new Response(JSON.stringify({ success: false, error: result.message }), {
									status: 400,
									headers: { 'Content-Type': 'application/json;charset=utf-8' }
								});
							}
						} catch (error) {
							return new Response(JSON.stringify({ success: false, error: error.message }), {
								status: 500,
								headers: { 'Content-Type': 'application/json;charset=utf-8' }
							});
						}
					} else if (访问路径 === 'admin/users/update') { // 更新用户
						try {
							const userData = await request.json();
							const userId = userData.userId || userID;
							const days = userData.days || USER_EXPIRATION_DAYS_DEFAULT;

							const result = await updateUser(env, userId, days);
							if (result.success) {
								return new Response(JSON.stringify({ success: true, message: '用户更新成功', user: result.user }), {
									status: 200,
									headers: { 'Content-Type': 'application/json;charset=utf-8' }
								});
							} else {
								return new Response(JSON.stringify({ success: false, error: result.message }), {
									status: 400,
									headers: { 'Content-Type': 'application/json;charset=utf-8' }
								});
							}
						} catch (error) {
							return new Response(JSON.stringify({ success: false, error: error.message }), {
								status: 500,
								headers: { 'Content-Type': 'application/json;charset=utf-8' }
							});
						}
					} else if (访问路径 === 'admin/users/delete') { // 删除用户
						try {
							const userData = await request.json();
							const userId = userData.userId;

							const result = await deleteUser(env, userId);
							if (result.success) {
								return new Response(JSON.stringify({ success: true, message: '用户删除成功' }), {
									status: 200,
									headers: { 'Content-Type': 'application/json;charset=utf-8' }
								});
							} else {
								return new Response(JSON.stringify({ success: false, error: result.message }), {
									status: 400,
									headers: { 'Content-Type': 'application/json;charset=utf-8' }
								});
							}
						} catch (error) {
							return new Response(JSON.stringify({ success: false, error: error.message }), {
								status: 500,
								headers: { 'Content-Type': 'application/json;charset=utf-8' }
							});
						}
					} else if (访问路径 === 'admin/users/list') { // 获取所有用户
						try {
							const result = await getAllUsers(env);
							if (result.success) {
								return new Response(JSON.stringify({ success: true, users: result.users }), {
									status: 200,
									headers: { 'Content-Type': 'application/json;charset=utf-8' }
								});
							} else {
								return new Response(JSON.stringify({ success: false, error: result.message }), {
									status: 400,
									headers: { 'Content-Type': 'application/json;charset=utf-8' }
								});
							}
						} catch (error) {
							return new Response(JSON.stringify({ success: false, error: error.message }), {
								status: 500,
								headers: { 'Content-Type': 'application/json;charset=utf-8' }
							});
						}
					} else {
						// 对于其他admin请求，使用原始项目的管理页面
						// 从外部获取管理页面内容
						return fetch(Pages静态页面 + '/admin');
					}
				} else if (访问路径 === 'sub') {//处理订阅请求
					const 订阅TOKEN = await MD5MD5(host + userID), 作为优选订阅生成器 = ['1', 'true'].includes(env.BEST_SUB) && url.searchParams.get('host') === 'example.com' && url.searchParams.get('uuid') === '00000000-0000-4000-8000-000000000000' && UA.toLowerCase().includes('tunnel (https://github.com/cmliu/edge');
					if (url.searchParams.get('token') === 订阅TOKEN || 作为优选订阅生成器) {
						// 验证用户是否过期
						const validation = await validateUserExpiration(env, userID);
						if (!validation.valid) {
							// 用户已过期，返回错误信息
							return new Response(validation.message, { 
								status: 403, 
								headers: { 
									'Content-Type': 'text/plain; charset=utf-8',
									'Cache-Control': 'no-store'
								} 
							});
						}
						
						config_JSON = await 读取config_JSON(env, host, userID, UA);
						if (作为优选订阅生成器) ctx.waitUntil(请求日志记录(env, request, 访问IP, 'Get_Best_SUB', config_JSON, false));
						else ctx.waitUntil(请求日志记录(env, request, 访问IP, 'Get_SUB', config_JSON));
						const ua = UA.toLowerCase();
						// 使用用户的实际过期时间替代固定时间
						const expire = validation.user && validation.user.expiration ? Math.floor(validation.user.expiration / 1000) : 4102329600;//使用用户过期时间或默认时间
						const now = Date.now();
						const today = new Date(now);
						today.setHours(0, 0, 0, 0);
						const UD = Math.floor(((now - today.getTime()) / 86400000) * 24 * 1099511627776 / 2);
						let pagesSum = UD, workersSum = UD, total = 24 * 1099511627776;
						if (config_JSON.CF.Usage.success) {
							pagesSum = config_JSON.CF.Usage.pages;
							workersSum = config_JSON.CF.Usage.workers;
							total = Number.isFinite(config_JSON.CF.Usage.max) ? (config_JSON.CF.Usage.max / 1000) * 1024 : 1024 * 100;
						}
						const responseHeaders = {
							"content-type": "text/plain; charset=utf-8",
							"Profile-Update-Interval": config_JSON.优选订阅生成.SUBUpdateTime,
							"Profile-web-page-url": url.protocol + '//' + url.host + '/admin',
							"Subscription-Userinfo": `upload=${pagesSum}; download=${workersSum}; total=${total}; expire=${expire}`,
							"Cache-Control": "no-store",
						};
						const isSubConverterRequest = url.searchParams.has('b64') || url.searchParams.has('base64') || request.headers.get('subconverter-request') || request.headers.get('subconverter-version') || ua.includes('subconverter') || ua.includes(('CF-Workers-SUB').toLowerCase()) || 作为优选订阅生成器;
						const 订阅类型 = isSubConverterRequest
							? 'mixed'
							: url.searchParams.has('target')
								? url.searchParams.get('target')
								: url.searchParams.has('clash') || ua.includes('clash') || ua.includes('meta') || ua.includes('mihomo')
									? 'clash'
									: url.searchParams.has('sb') || url.searchParams.has('singbox') || ua.includes('singbox') || ua.includes('sing-box')
										? 'singbox'
										: url.searchParams.has('surge') || ua.includes('surge')
											? 'surge&ver=4'
											: url.searchParams.has('quanx') || ua.includes('quantumult')
												? 'quanx'
												: url.searchParams.has('loon') || ua.includes('loon')
													? 'loon'
													: 'mixed';
						// ... 其他订阅逻辑
					}
				}
			}
		}
	}
};

// 用户管理相关函数
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

        // 检查用户是否设置了过期时间
        if (user.expiration) {
            if (now > user.expiration) {
                // 用户已过期
                return { valid: false, message: '用户已过期，请联系管理员续期' };
            } else {
                // 用户有效
                return { valid: true, user: user };
            }
        } else {
            // 没有设置过期时间，认为是永久用户
            return { valid: true, user: user };
        }
    } catch (error) {
        console.error('验证用户时出错:', error);
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

// 辅助函数定义
async function MD5MD5(str) {
    // 这里应该实现MD5哈希算法
    // 简化实现，实际项目中需要完整MD5实现
    return str; // 临时返回原值，实际需要实现MD5
}

function 修正请求URL(urlStr) {
    return urlStr;
}

async function 整理成数组(str) {
    if (typeof str === 'string') {
        return str.split(',').map(item => item.trim()).filter(item => item);
    }
    return [];
}

function log(message) {
    console.log(message);
}

async function 反代参数获取(url) {
    // 空实现
}

async function 处理WS请求(request, userID, url) {
    return new Response('WebSocket处理');
}

async function 处理gRPC请求(request, userID) {
    return new Response('gRPC处理');
}

async function 处理XHTTP请求(request, userID) {
    return new Response('XHTTP处理');
}

async function 读取config_JSON(env, host, userID, UA) {
    return {};
}

async function 请求日志记录(env, request, 访问IP, 类型, config_JSON, flag) {
    // 空实现
}