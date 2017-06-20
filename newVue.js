var Vue = (function(root){
    var __DEFS__ = {
        el : null,
        data : null
    };
    var __CMDS__ = {
        "text" : {
            cmd:"text",
            callback:function(node,value){
                node.data = value
            },
            parse:function(node){
                if(/\{\{\s*(\w+)\s*\}\}/.exec(node.data)){
                    this.$bind[RegExp.$1] = this.$bind[RegExp.$1]||[]
                    this.$bind[RegExp.$1].push(node.ref)
                    node.ref.cmdType = 'text'
                }
            }
        },
        "if" : {
            cmd:"if",
            callback:function(node,value){
                if(!value){
                    node.next = node.nextElementSibling
                    node.remove()
                }else{
                    if(node.next){
                        node.ref.parentNode.ref.insertBefore(node,node.next)
                    }else{
                        node.ref.parentNode.ref.appendChild(node)
                    }
                }
            },
            parse:function(element){
                var m = element.getAttribute("v-"+__CMDS__['if'].cmd)
                this.$bind[m] = this.$bind[m]||[]
                this.$bind[m].push(element.ref)
                element.ref.cmdType = 'if'
            }
        },
        "show" : {
            cmd:"show",
            callback:function(node,value){
                if(!value){
                    node.style.display="none"
                }else{
                    node.style.display="block"
                }
            },
            parse:function(element){
                var m = element.getAttribute("v-"+__CMDS__['show'].cmd)
                this.$bind[m] = this.$bind[m]||[]
                this.$bind[m].push(element.ref)
                element.ref.cmdType = 'show'
            }
        },
        "for" : {
            cmd:"for",
            callback:function(node,value){
                if(value instanceof Array){
                    var vcal = node.ref;
                    var caches = vcal.caches = vcal.caches||[]//虚dom上的缓存数组
                    var parentNode = vcal.parent = vcal.parent||node.parentNode
                    node.remove()//将它从父元素节点上移除
                    parentNode.innerHTML = ''//清空原本的HTML，重新生成子节点
                    var clone,scope = node.scope,text;
                    value.forEach(function(obj,index){
                        if(caches[index]){
                            clone = caches[index]
                        }else{
                            clone = node.cloneNode(true)
                            if(index<vcal.cacheSize){
                                caches.push(clone)//添加到clone对象中
                            }
                        }
                        if(/(\{\{(\w+)\.(\w+)\}\})/.exec(vcal.innerText)){
                            text = vcal.innerText
                            text = text.replace(RegExp.$1,obj[RegExp.$3])
                            clone.innerText = text.replace(/\s/g,"")
                        }
                        parentNode.appendChild(clone);
                    });
                }
            },
            parse:function(element){
                var m = element.getAttribute("v-"+__CMDS__['for'].cmd)
                if(/(\w+)\sin\s(\w+)/.exec(m)){
                    this.$bind[RegExp.$2] = this.$bind[RegExp.$2]||[]
                    this.$bind[RegExp.$2].push(element.ref)
                    element.ref.scope = RegExp.$1
                    element.cacheSize = element.getAttribute("v-cache-size")||0
                    element.ref.cmdType = 'for'
                }else{
                    throw new Error("for指令语法解析错误")
                }
            }
        },
        "model" : {
            cmd:"model",
            callback:function(node,value){
                node.value = value;
            },
            parse:function(element){
                var m = element.getAttribute("v-"+__CMDS__['model'].cmd);
                this.$bind[m] = this.$bind[m]||[]
                this.$bind[m].push(element.ref)
                element.ref.onkeyup = function(){
                    model[m] = this.value
                }
                element.ref.cmdType = 'model'
            }
        }
    }
    //vue实现内部机制的功能方法
    var __PROTOTYPE__ = {
        observerFactory:function(model){
            for(var property in model){
                this.addObserver(model,property,model[property]);
                if(model[property] instanceof Array){
                    //如果是数组，数组的某些方法被调用之后，我们也需要通知
                    this.addFunction(model,property,model[property])
                }else if(model[property] instanceof Object){
                    this.observerFactory(model[property])//递归
                }
            }
        },
        addObserver:function(model,property,value){
            var that = this
            Object.defineProperty(model,property,{
              enumerable:true,//是否可枚举
              configurable:false,//是否以后还可以配置name属性
              set:function reactiveSetter(nvalue){
                value = nvalue;
                that.notify(model,property,value)
              },
              get:function reactiveGetter(){
                return value;
              }
            })
        },
        addFunction:function(model,property,value){
            var that = this;
            ["push","pop","splice","shift","unshift","slice","reverse","sort"].forEach(function(method){
                var __o__ = Array.prototype[method]
                //我们改变了数组对象的method方法
                model[property][method] = function(){
                    var res = __o__.apply(this,arguments)//调用__o__方法
                    that.notify(model,property,model[property])
                    return res
                }
            })
        },
        notify:function(obj,key,value){
            if(!this.$bind[key])return;
            this.$bind[key].forEach(function(node){
                __CMDS__[node.cmdType].callback.call(this,node,value)
            })
        },
        mvvm:function(node){
            var clone = node.cloneNode(false)//复制节点 true代表深度克隆 false代表只克隆当前node
            node.ref = clone//让克隆对象和模板对象的node发生关系
            clone.ref = node
            for(var i=0;i<node.childNodes.length;i++){
                clone.appendChild(this.mvvm(node.childNodes[i]))
            }
            switch(node.nodeType){
                case 1:
                    this.parseElement(node)//解析元素的指令的
                    break;
                case 3:
                    __CMDS__['text'].parse.call(this,node)
                    break;
                default:
 
            }

            console.log(node);
            console.log(node.nodeType);
            
            return clone
        },
        parseElement:function(element){
            for(var cmd in __CMDS__){
                if(element.hasAttribute("v-"+__CMDS__[cmd].cmd)){
                    __CMDS__[cmd].parse.call(this,element)
                }
            }
        },
        init:function(clone){
            this.$el.parentNode.appendChild(clone)
            this.$el.remove()
            // console.log(this.$data);
            for(var prop in this.$data){
                this.$data[prop] = this.$data[prop]
            }
        }
    };
    //vue实现闭包
    var __VUE__ = function(ops){
        this.$bind = {}
        this.$el = document.querySelector(ops.el)
        if(!this.$el)throw new Error("没有找到上下文")
        this.observerFactory(ops.data)
        this.$data = ops.data
        this.init(this.mvvm(this.$el))//渲染
    }
    __VUE__.prototype = __PROTOTYPE__
    return __VUE__;
})(window)