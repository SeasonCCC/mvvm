;
var MVVM = (function(root){

	var __CMDS__ = {
		"text": {
			notifyAction: function(node, value){
				node.data = value;
			},
			phase: function(node){
				if (/\{\{\s*(\w+)\s*\}\}/.exec(node.data)) {
					node.cmdType = "text";
					this.$bind[RegExp.$1] = this.$bind[RegExp.$1] || [];
					this.$bind[RegExp.$1].push(node);
				}
			}
		},

		"if": {
			notifyAction: function(node, value){

				if (!value) {
					node.next = node.nextElementSibling;
					node.parent = node.parentNode;
					// console.log(node.parent);
					node.remove();
				} else{
					if (node.next && node.parent) {
						node.parent.insertBefore(node, node.next);
					}else if(node.parent){
						node.parent.appendChild(node);
					}
				}
				// console.log(node.nextElementSibling);
			},
			phase: function(node){
				node.cmdType = "if";
				var attrVal = node.getAttribute("v-if");
				// console.log(typeof attrVal);
				this.$bind[attrVal] = this.$bind[attrVal] || [];
				this.$bind[attrVal].push(node);
			}
		},

		"show": {
			notifyAction: function(node, value){
				if (!value) {
					node.style.display = "none";
				} else{
					node.style.display = "block";
				}
			},
			phase: function(node){
				node.cmdType = "show";
				var attrVal = node.getAttribute("v-show");
				// console.log(typeof attrVal);
				this.$bind[attrVal] = this.$bind[attrVal] || [];
				this.$bind[attrVal].push(node);
			}			
		}
	}


	var __PROTOTYPE__ = {
		// 观察者工厂
		_observerFactory: function(model) {
			for(key in model){
				this._addObserver(model, key, model[key]);
				if (this[key] instanceof Array) {
					//如果是数组，数组的某些方法被调用之后，我们也需要通知
					this._addFunction(model, key);
				} else if(this[key] instanceof Object){
					this._observerFactory(this[key]);
				}
			}		
		}, 

		//添加观察者
		_addObserver: function(model, key, val) {
			var that = this;
			Object.defineProperty(model, key, {
				enumerable: true,   // 可枚举
				configurable: true, // 可重新定义
				get: function(){
					return val;
				},
				set: function(newVal){
					// if (val === newVal || (newVal !== newVal && val !== val)) {
					// 	console.log("123");
					// 	return;
					// }
					// console.log('数据更新啦 ', val, '=>', newVal);
					val = newVal;
					that._notify(model, key, val);
				}
			})	
		},

		// 为数组添加方法
		_addFunction: function(model, key){
			var functionArr = ["pop", "push", "shift", "splice", "unshift", "slice", "concat", "reverse", "sort"];
			var that = this;
			functionArr.forEach(function(method){				
				var arrPro = Array.prototype[method];
				//改变数组对象的method方法
				model[key][method] = function(){
					var res = arrPro.apply(this, arguments);
					that._notify(model, key, model[key]);
					return res;
				}
			})
		}, 

		//通知
		_notify: function(obj, key, value){
			if(!this.$bind[key])return;
			this.$bind[key].forEach(function(cloneNode){
				__CMDS__[cloneNode.cmdType].notifyAction.call(this, cloneNode, value);

				// if (cloneNode.cmdType == "text") {

				// 	cloneNode.data = value;
				// }else if(cloneNode.cmdType == "if"){
				// 	if (value) {
				// 		cloneNode.remove();
				// 	} else{

				// 	}
				// }
			})

			// console.log(obj);
			// console.log("的"+key+"属性发生了改变，改变后的结果是"+value);
		},


		// 虚拟dom
		_virtualDom: function(node){
			var clone = node.cloneNode(false);
			clone.ref = node;
			for (var i = 0; i < node.childNodes.length; i++) {
				clone.appendChild(this._virtualDom(node.childNodes[i]));
			};

			switch (clone.nodeType){
				case 1: 
					this._parseElement(clone);
					break;
				case 3: 
					__CMDS__["text"].phase.call(this, clone);
					// if (/\{\{\s*(\w+)\s*\}\}/.exec(clone.data)) {
					// 	clone.cmdType = "text";
					// 	this.$bind[RegExp.$1] = this.$bind[RegExp.$1] || [];
					// 	this.$bind[RegExp.$1].push(clone);
					// }
					break;
				default:
			}
			return clone;
		},


		// 解析指令
		_parseElement: function(element){

			// console.log(element);
			for (var cmd in __CMDS__) {
				if (element.hasAttribute("v-"+cmd+"")) {
					__CMDS__[cmd].phase.call(this, element);
				}
			};

		},

		// 初始化
		_init: function(clone){
			// console.log(this.$bind);
			this.$el.parentNode.appendChild(clone);
			this.$el.remove();
			for(var prop in this.$data){
				this.$data[prop] = this.$data[prop];
			}
		}
	}

	var MVVM = function(options){
		this.$bind = {}; //储存需要改变的element
		this.$el = document.querySelector(options.el);
		if(!this.$el)throw new Error("没有找到上下文");

		this._observerFactory(options.data);
		this.$data = options.data;
		this._init(this._virtualDom(this.$el));
		// console.log(options.data);
		// for(var key in options.data){
		// 	this[key] = options.data[key];
		// }

	};


	MVVM.prototype = __PROTOTYPE__;


	return MVVM;
})(window);