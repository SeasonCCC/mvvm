;
var MVVM = (function(root){

	var __CMDS__ = {

	}


	var __PROTOTYPE__ = {
		// 初始化虚拟dom
		_init: function(options){
		},	


		// 观察者工厂
		_observerFactory: function(model) {
			for(key in model){
				this._addObserver(this, key, this[key]);
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
			Object.defineProperty(model, key, {
				enumerable: true,   // 可枚举
				configurable: true, // 可重新定义
				get: function(){
					return val;
				},
				set: function(newVal){
					if (val === newVal || (newVal !== newVal && val !== val)) {
						return;
					}
					// console.log('数据更新啦 ', val, '=>', newVal);
					val = newVal;
					this._notify(model, key, val);
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
			console.log(obj);
			console.log("的"+key+"属性发生了改变，改变后的结果是"+value);
		},


		// 虚拟dom
		_virtualDom: function(node){
			var clone = node.cloneNode(false);
			node.ref = clone;
			clone.ref = node;

			for (var i = 0; i < node.childNodes.length; i++) {
				clone.appendChild(this._virtualDom(node.childNodes[i]));
			};

			switch (node.nodeType){
				case 1: 
					break;
				case 3: 
					if (/\{\{\s*(\w+)\s*\}\}/.exec(node.data)) {
						console.log(RegExp.$1);
						node.ref.data = "123456";
					}
					break;
				default: 			
			}

			// console.log(node);
			// console.log(node.nodeType);
			return clone;
		},

		_init: function(clone){
			this.$el.parentNode.appendChild(clone);
			this.$el.remove();
		}
	}

	var MVVM = function(options){
		this.$bind = {};
		this.$el = document.querySelector(options.el);
		if(!this.$el)throw new Error("没有找到上下文");
		for(key in options.data){
			this[key] = options.data[key];
		}
		this._observerFactory(options.data);
		this._init(this._virtualDom(this.$el));
	};


	MVVM.prototype = __PROTOTYPE__;


	return MVVM;
})(window);