"use strict";
(function() {
	var scripts = document.getElementsByTagName('script');
	var scriptTag = scripts[scripts.length - 1];
	var config = scriptTag.getAttribute('data-config');
	var url = scriptTag.getAttribute('src');
	var urlRegx = /(\?\w+\=\w+\&)/g;
	var match = String(url.match(urlRegx));
	var start = match.indexOf("=");
	var end = match.indexOf("&");
	var token = match.substring(start + 1, end);
	var iframeId = Math.floor(Math.random() * 100000) + '';
	var minheight = 25;
	var maxheight = 380;
	var d = -300;
	//1，获取url上的token
	//2，以jsonp形式跨域请求：http://10.10.0.115/doc/mockdata/im/tokenverify.action.js
	//  2.1，返回false则什么都不做
	//  2.2，返回true则进行正常初始化
	//3，构建一个iframe
	//  3.1，监听postmessage事件，关闭iframe
	//  3.2，iframe支持打开关闭的动画效果（纯原生手写）
	var init = function() {
		JSONP.getJSON("http://10.10.0.115:3001/im/token-validate?callback=sendJsonp", null, sendJsonp);
	};
	var bindEvent = function(elem, type, handler) {
		if (window.addEventListener) {
			elem.addEventListener(type, handler, false);
		} else if (window.attachEvent) { //IE
			elem.attachEvent("on" + type, handler);
		}
	};
	var createPostmessageListener = function() {
		// 把子窗口发送过来的数据显示在父窗口中
		if (window.addEventListener) {
			window.addEventListener("message", function(event) {
				initPostmessageListener(event);
			}, false);
		} else if (window.attachEvent) {
			window.attachEvent("message", function(event) {
				initPostmessageListener(event);
			}, false);
		}
	};
	var initPostmessageListener = function(event) {
		if (event.data == "close") {
			// var iframe = document.getElementById('iframe' + iframeId + '');
			var iframeWarp = document.getElementById('iframeWarp')
			// animate(iframe, {width: -1, height: 200},0.01, 0.01);
			animateDown();
		} else {
			document.getElementById("content").innerHTML += event.data + "<br/>";
		}
	};
	var sendJsonp = function(json) {
		if (json.success) {
			var iframeElement = document.getElementsByTagName('iframe');
			if (iframeElement.length > 0) {
				var iframe = document.getElementById('iframe' + iframeId + '');
				iframe.style.display = 'block';
				return;
			} else {
				try {
					var iframe = document.createElement('<iframe name="iframe" id="iframe' + iframeId + '"></iframe>');
				} catch (e) {
					var iframe = document.createElement('iframe');
					iframe.name = 'iframe';
					iframe.id = "iframe" + iframeId;
				}
				iframe.setAttribute('style', 'position:relative;bottom:0;right:0;height:300px;width:200px;border:1px solid #eee;background-color:#fff;z-index:2');
				iframe.src = '../im/iframe.html';
				document.body.style.overflow = 'hidden';
				var iframeWarp = document.createElement('div');
				iframeWarp.setAttribute('style', 'position:absolute;bottom:-300px;right:0;height:300px;width:200px;border:1px solid #eee;background-color:#fff;z-index:2');
				iframeWarp.id = 'iframeWarp';
				// iframe.style.display = 'none';
				// animate(iframe, {
				// 	width: 300,
				// 	height: 200
				// }, 0.05, 0.01);
				iframeWarp.appendChild(iframe);
				document.body.appendChild(iframeWarp);
				var btn = document.createElement('a');
				btn.setAttribute('href', 'javascript:;');
				btn.setAttribute('style', 'position:absolute;bottom:0;right:0;height:30px;width:90px;background-color:#00aaef;color:#fff;border-radius:5px;line-height:30px;text-align:center;text-decoration:none;');
				btn.id = 'start';
				btn.text = '开始';
				document.body.appendChild(btn);
				bindEvent(btn, 'click', function() {
					animateUp();
					// iframe.style.bottom = 'block';
				});
				createPostmessageListener();
			}
		} else {
			return;
		}
	};
	var BrowserType = function() {
		var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串  
		var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera; //判断是否IE浏览器  
		if (isIE) {
			return "1";
		} else {
			return "-1";
		}
	};
	var JSONP = {
		// 获取当前时间戳
		now: function() {
			return (new Date()).getTime();
		},
		// 获取16位随机数
		rand: function() {
			return Math.random().toString().substr(2);
		},
		// 删除节点元素
		removeElem: function(elem) {
			var parent = elem.parentNode;
			if (parent && parent.nodeType !== 11) {
				parent.removeChild(elem);
			}
		},
		// url组装
		parseData: function(data) {
			var ret = "";
			if (typeof data === "string") {
				ret = data;
			} else if (typeof data === "object") {
				for (var key in data) {
					ret += "&" + key + "=" + encodeURIComponent(data[key]);
				}
			}
			// 加个时间戳，防止缓存
			ret += "&_time=" + this.now();
			ret = ret.substr(1);
			return ret;
		},
		getJSON: function(url, data, func) {
			// 函数名称
			var name;
			// 拼装url
			url = url + (url.indexOf("?") === -1 ? "?" : "&") + this.parseData(data);
			// 检测callback的函数名是否已经定义
			var match = /callback=(\w+)/.exec(url);
			if (match && match[1]) {
				name = match[1];
			} else {
				// 如果未定义函数名的话随机成一个函数名
				// 随机生成的函数名通过时间戳拼16位随机数的方式，重名的概率基本为0
				// 如:jsonp_1355750852040_8260732076596469
				name = "jsonp_" + this.now() + '_' + this.rand();
				// 把callback中的?替换成函数名
				url = url.replace("callback=?", "callback=" + name);
				// 处理?被encode的情况
				url = url.replace("callback=%3F", "callback=" + name);
			}
			// 创建一个script元素
			var script = document.createElement("script");
			script.type = "text/javascript";
			// 设置要远程的url
			script.src = url;
			// 设置id，为了后面可以删除这个元素
			script.id = "id_" + name;
			// 在head里面插入script元素
			var head = document.getElementsByTagName("head");
			if (head && head[0]) {
				head[0].appendChild(script);
			}

			// 把传进来的函数重新组装，并把它设置为全局函数，远程就是调用这个函数
			window[name] = function(json) {
				// 执行这个函数后，要销毁这个函数
				window[name] = undefined;
				// 获取这个script的元素
				var elem = document.getElementById("id_" + name);
				// 删除head里面插入的script，这三步都是为了不影响污染整个DOM
				JSONP.removeElem(elem);
				// 执行传入的的函数
				func(json);
			};


		}
	};
    var openAnim;
	var animateUp = function() {
		var iframeWarp = document.getElementById("iframeWarp");
		var bottom = Number(iframeWarp.style.bottom.slice(0,-2));
		if( bottom < 0){
	       iframeWarp.style.bottom = (bottom + 20) + 'px';
	       openAnim = setTimeout(animateUp,10);        
		  }else{
		     try{
		         clearTimeout(openAnim);
		     }catch(e){}
		}
	};
	var closeAnim;
	var animateDown = function() {
		var iframeWarp = document.getElementById("iframeWarp");
		var bottom = Number(iframeWarp.style.bottom.slice(0,-2));
		var height = -(Number(iframeWarp.style.height.slice(0,-2)));
		if( bottom <= 0 && bottom >= height){
	       iframeWarp.style.bottom = (bottom - 20) + 'px';
	       closeAnim = setTimeout(animateDown,10);        
		  }else{
		     try{
		         clearTimeout(closeAnim);
		     }catch(e){}
		}
	};

	window.setTimeout(init, 100);
})();