;
var MVVM = (function(root){

	var __CMDS__ = {

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
				if (cloneNode.cmdType == "text") {
					cloneNode.data = value;
				}else if(cloneNode.cmdType == "if"){
					if (value) {
						cloneNode.remove();
					} else{

					}
				}
			})

			// console.log(obj);
			// console.log("的"+key+"属性发生了改变，改变后的结果是"+value);
		},


		// 虚拟dom
		_virtualDom: function(node){
			var clone = node.cloneNode(false);
			for (var i = 0; i < node.childNodes.length; i++) {
				clone.appendChild(this._virtualDom(node.childNodes[i]));
			};

			switch (clone.nodeType){
				case 1: 
					this._parseElement(clone);
					break;
				case 3: 
					if (/\{\{\s*(\w+)\s*\}\}/.exec(clone.data)) {
						clone.cmdType = "text";
						this.$bind[RegExp.$1] = this.$bind[RegExp.$1] || [];
						this.$bind[RegExp.$1].push(clone);
					}
					break;
				default:
			}
			return clone;
		},


		// 解析指令
		_parseElement: function(element){
			
			if (element.hasAttribute("v-if")) {
				element.cmdType = "if";
				var attrVal = element.getAttribute("v-if");
				this.$bind[attrVal] = this.$bind[attrVal] || [];
				this.$bind[attrVal].push(element);
			} else{

			};
		},

		// 初始化
		_init: function(clone){
			console.log(this.$bind);
			this.$el.parentNode.appendChild(clone);
			this.$el.remove();
			for(var prop in this.$data){
				this.$data[prop] = this.$data[prop];
			}
		}
	}

	var MVVM = function(options){
		this.$bind = {};
		this.$el = document.querySelector(options.el);
		if(!this.$el)throw new Error("没有找到上下文");

		this._observerFactory(options.data);
		this.$data = options.data;
		this._init(this._virtualDom(this.$el));
		// console.log(options.data);
		for(var key in options.data){
			this[key] = options.data[key];
		}

	};


	MVVM.prototype = __PROTOTYPE__;


	return MVVM;
})(window);