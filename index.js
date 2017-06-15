;
var MVVM = (function(root){
	function MVVM(options){
		for(key in options.data){
			this[key] = options.data[key];
		}

		this.observerFactory(options.data);
	};

	MVVM.prototype.observerFactory = function(model) {
		for(key in model){
			this.addObserver(this, key, this[key]);
			if (this[key] instanceof Array) {
				//如果是数组，数组的某些方法被调用之后，我们也需要通知
				this.addFunction();
			} else if(this[key] instanceof Object){
				this.observerFactory(this[key]);
			}
		}		
	};

	MVVM.prototype.addObserver = function(model, key, val) {
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
				console.log('数据更新啦 ', val, '=>', newVal);
				val = newVal;
			}
		})		
	};

	MVVM.prototype.addFunction = function(){
		
	}

	return MVVM;
})(window);