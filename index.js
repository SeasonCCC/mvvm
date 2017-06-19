;
var MVVM = (function(root){
	function MVVM(options){
		for(key in options.data){
			this[key] = options.data[key];
		}
		// console.log(this);
		this.bind = this._init(options);
		this._observerFactory(options.data);
	};


	MVVM.prototype = {
		// 初始化虚拟dom
		_init: function(options){
			var __node__ = document.querySelector(options.el);
			var __clone__ = __node__.cloneNode(false);

			
			console.log(__clone__);
			return;
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
			var __functionArr__ = ["pop", "push", "shift", "splice", "unshift", "slice", "concat", "reverse", "sort"];
			var __this__ = this;
			__functionArr__.forEach(function(method){				
				var __arrPro__ = Array.prototype[method];
				//改变数组对象的method方法
				model[key][method] = function(){
					var __res__ = __arrPro__.apply(this, arguments);
					__this__._notify(model, key, model[key]);
					return __res__;
				}
			})
		}, 


		_notify: function(obj, key, value){
			console.log(obj);
			console.log("的"+key+"属性发生了改变，改变后的结果是"+value);
		}
	}


	return MVVM;
})(window);