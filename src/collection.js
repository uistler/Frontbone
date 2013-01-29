(function(){
	var itself=function(self){
		this.self=self;
	}
	var Collection=Model.extend({
		
		constructor: function(models,attributes)
		{
			//Model.call(this,attributes);
			//this._super(attributes);
			this.itself=new itself(this);
			this.models=[];
			this.length=0;
			
			if(models&&models.length)
			{
				this.reset(models);
			}
			this.initialize();
			
		},
		models: [],
		model: Model,
		url: function(){
			return this.baseURL+this.model.prototype.mapping+'/';
		},
		fetch: function(options){
			var me=this;
			options||(options={});
			var opt={
				success: function(data){
					me.reset(data,options);
					if(typeof options.success == 'function')
					{
						options.success.apply(me,arguments);
					}
				},
				error: function(){
					if(typeof options.error == 'function')
					{
						options.error.apply(me,arguments);
					}
				}
			}
			var resOpt=_.extend({},options,opt);
			Model.sync('GET', this.url(), resOpt);
		},
		reset: function(json,options){
			options||(options={});
			if(!options.add)
			{
				this.models=[];
				this.length=0;
			}
			if(!json)
			{
				this.fire('reset');
				return;
			}
				
				
			var modelsArr=this.parse(json);
			
			if(modelsArr instanceof Array)
			{
				for(var i=0,l=modelsArr.length;i<l;i++)
				{
					this.add(modelsArr[i],'end',true);
				}
				if(options.add)
					this.fire('add',modelsArr,0);
				else
					this.fire('reset');
			}
			else
			{
				this.add(modelsArr,'end',true);
				if(options.add)
					this.fire('add',[modelsArr],0);
				else
					this.fire('reset');
			}
		},
		push: function(model){
			return this.add(model);
		},
		unshift: function(model){
			return this.add(model,0);
		},
		add: function(model,index,silent){
			typeof index=='number'||(index=this.length);
			if(!(model instanceof Model))
			{
				model=Model.createOrUpdate(this.model, model);
			}
			var me=this;
			model.one('remove',function(){
				me.cutByCid(this.cid);
			})
			this.models.splice(index, 0, model);
			this.length=this.models.length;
			if(!silent)
				this.fire('add',[model],index);
			return this;
		},
		cut: function(id){
			var found;
			this.each(function(model,index){
				if(model.id==id)
				{
					found=this.cutAt(index);
					return false;
				}
			})
			return found;
		},
		cutByCid: function(cid){
			var found;
			this.each(function(model,index){
				if(model.cid==cid)
				{
					found=this.cutAt(index);
					return false;
				}
			})
			return found;
		},
		shift: function(){
			return this.cutAt(0);
		},
		pop: function(){
			return this.cutAt();
		},
		cutAt: function(index){
			index!==undefined||(index=this.models.length-1);
			var model=this.models.splice(index, 1)[0];
			this.length=this.models.length;
			this.fire('cut',model,index);
			return model;
		},
		at: function(index){
			return this.models[index];
		},
		/**
		 * DEPRECATED since 26.01.2013
		 */
		get: function(){
			return this.getByID.apply(this, arguments);
		},
		getByID: function(id){
			var found;
			this.each(function(model){
				if(model.id==id)
				{
					found=model;
					return false;
				}
			})
			return found;
		},
		getByCid: function(cid){
			var found;
			this.each(function(model){
				if(model.cid==cid)
				{
					found=model;
					return false;
				}
			})
			return found;
		}
	});
	
	// Underscore methods that we want to implement on the Collection.
	var methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find',
	'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any',
	'include', 'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex',
	'toArray', 'size', 'first', 'initial', 'rest', 'last', 'without', 'indexOf',
	'shuffle', 'lastIndexOf', 'isEmpty', 'groupBy'];

	// Mix in each Underscore method as a proxy to `Collection#models`.
	_.each(methods, function(method) {
		Collection.prototype[method] = function() {
			return _[method].apply(_, [this.models].concat(_.toArray(arguments)));
		};
	});
	
	var filterMethods = ['filter', 'reject'];
	var sortMethods = ['sortBy','shuffle'];

	_.each(filterMethods, function(method) {
		itself.prototype[method] = function() {
			var antonym=method=='filter'?'reject':'filter';
			var self=this.self;
			var newModels=_[method].apply(_, [self.models].concat(_.toArray(arguments)));
			var rejectedModels=_[antonym].apply(_, [self.models].concat(_.toArray(arguments)));
			var indexes={};
			_.each(rejectedModels,function(model){
				indexes[self.indexOf(model)]=model;
			});
			self.models=newModels;
			self.length=newModels.length;
			//console.log(indexes);
			self.fire('reject', indexes);
			return self;
		};
	});
	
	_.each(sortMethods, function(method) {
		itself.prototype[method] = function() {
			var self=this.self;
			var newModels=_[method].apply(_, [self.models].concat(_.toArray(arguments)));
			var indexes={};
			_.each(newModels,function(model,index){
				indexes[self.indexOf(model)]=index;
			});
			self.models=newModels;
			self.length=newModels.length;
			//console.log(indexes);
			self.fire('sort', indexes);
			return self;
		};
	});
	
	this.Collection=Collection;
})();