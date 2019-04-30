var $global = typeof window != "undefined" ? window : typeof global != "undefined" ? global : typeof self != "undefined" ? self : this;
var console = $global.console || {log:function(){}};
var $hxClasses = $hxClasses || {},$estr = function() { return js.Boot.__string_rec(this,''); };
function $extend(from, fields) {
	function Inherit() {} Inherit.prototype = from; var proto = new Inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var EReg = $hxClasses["EReg"] = function(r,opt) {
	opt = opt.split("u").join("");
	this.r = new RegExp(r,opt);
	this.rs = r;
	this.opt = opt;
};
EReg.__name__ = ["EReg"];
EReg.prototype = {
	r: null
	,rs: null
	,opt: null
	,regenerate: function() {
		this.r = new RegExp(this.rs,this.opt);
	}
	,hxUnserialize: function(u) {
		this.rs = u.unserialize();
		this.opt = u.unserialize();
	}
	,hxSerialize: function(s) {
		s.serialize(this.rs);
		s.serialize(this.opt);
		this.regenerate();
	}
	,match: function(s) {
		if(this.r.global) this.r.lastIndex = 0;
		this.r.m = this.r.exec(s);
		this.r.s = s;
		return this.r.m != null;
	}
	,matched: function(n) {
		if(this.r.m != null && n >= 0 && n < this.r.m.length) return this.r.m[n]; else throw new js._Boot.HaxeError("EReg::matched");
	}
	,matchedLeft: function() {
		if(this.r.m == null) throw new js._Boot.HaxeError("No string matched");
		return HxOverrides.substr(this.r.s,0,this.r.m.index);
	}
	,matchedRight: function() {
		if(this.r.m == null) throw new js._Boot.HaxeError("No string matched");
		var sz = this.r.m.index + this.r.m[0].length;
		return HxOverrides.substr(this.r.s,sz,this.r.s.length - sz);
	}
	,matchedPos: function() {
		if(this.r.m == null) throw new js._Boot.HaxeError("No string matched");
		return { pos : this.r.m.index, len : this.r.m[0].length};
	}
	,matchSub: function(s,pos,len) {
		if(len == null) len = -1;
		if(this.r.global) {
			this.r.lastIndex = pos;
			this.r.m = this.r.exec(len < 0?s:HxOverrides.substr(s,0,pos + len));
			var b = this.r.m != null;
			if(b) this.r.s = s;
			return b;
		} else {
			var b1 = this.match(len < 0?HxOverrides.substr(s,pos,null):HxOverrides.substr(s,pos,len));
			if(b1) {
				this.r.s = s;
				this.r.m.index += pos;
			}
			return b1;
		}
	}
	,replace: function(s,by) {
		return s.replace(this.r,by);
	}
	,__class__: EReg
};
var HxOverrides = $hxClasses["HxOverrides"] = function() { };
HxOverrides.__name__ = ["HxOverrides"];
HxOverrides.strDate = function(s) {
	var _g = s.length;
	switch(_g) {
	case 8:
		var k = s.split(":");
		var d = new Date();
		d.setTime(0);
		d.setUTCHours(k[0]);
		d.setUTCMinutes(k[1]);
		d.setUTCSeconds(k[2]);
		return d;
	case 10:
		var k1 = s.split("-");
		return new Date(k1[0],k1[1] - 1,k1[2],0,0,0);
	case 19:
		var k2 = s.split(" ");
		var y = k2[0].split("-");
		var t = k2[1].split(":");
		return new Date(y[0],y[1] - 1,y[2],t[0],t[1],t[2]);
	default:
		throw new js._Boot.HaxeError("Invalid date format : " + s);
	}
};
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) return undefined;
	return x;
};
HxOverrides.substr = function(s,pos,len) {
	if(pos != null && pos != 0 && len != null && len < 0) return "";
	if(len == null) len = s.length;
	if(pos < 0) {
		pos = s.length + pos;
		if(pos < 0) pos = 0;
	} else if(len < 0) len = s.length + len - pos;
	return s.substr(pos,len);
};
HxOverrides.indexOf = function(a,obj,i) {
	var len = a.length;
	if(i < 0) {
		i += len;
		if(i < 0) i = 0;
	}
	while(i < len) {
		if(a[i] === obj) return i;
		i++;
	}
	return -1;
};
HxOverrides.remove = function(a,obj) {
	var i = HxOverrides.indexOf(a,obj,0);
	if(i == -1) return false;
	a.splice(i,1);
	return true;
};
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
};
var Lambda = $hxClasses["Lambda"] = function() { };
Lambda.__name__ = ["Lambda"];
Lambda.count = function(it,pred) {
	var n = 0;
	if(pred == null) {
		var $it0 = $iterator(it)();
		while( $it0.hasNext() ) {
			var _ = $it0.next();
			n++;
		}
	} else {
		var $it1 = $iterator(it)();
		while( $it1.hasNext() ) {
			var x = $it1.next();
			if(pred(x)) n++;
		}
	}
	return n;
};
var List = $hxClasses["List"] = function() {
	this.length = 0;
};
List.__name__ = ["List"];
List.prototype = {
	h: null
	,q: null
	,length: null
	,add: function(item) {
		var x = [item];
		if(this.h == null) this.h = x; else this.q[1] = x;
		this.q = x;
		this.length++;
	}
	,first: function() {
		if(this.h == null) return null; else return this.h[0];
	}
	,isEmpty: function() {
		return this.h == null;
	}
	,__class__: List
};
Math.__name__ = ["Math"];
var Reflect = $hxClasses["Reflect"] = function() { };
Reflect.__name__ = ["Reflect"];
Reflect.hasField = function(o,field) {
	return Object.prototype.hasOwnProperty.call(o,field);
};
Reflect.field = function(o,field) {
	try {
		return o[field];
	} catch( e ) {
		if (e instanceof js._Boot.HaxeError) e = e.val;
		return null;
	}
};
Reflect.setField = function(o,field,value) {
	o[field] = value;
};
Reflect.callMethod = function(o,func,args) {
	return func.apply(o,args);
};
Reflect.fields = function(o) {
	var a = [];
	if(o != null) {
		var hasOwnProperty = Object.prototype.hasOwnProperty;
		for( var f in o ) {
		if(f != "__id__" && f != "hx__closures__" && hasOwnProperty.call(o,f)) a.push(f);
		}
	}
	return a;
};
Reflect.isFunction = function(f) {
	return typeof(f) == "function" && !(f.__name__ || f.__ename__);
};
Reflect.deleteField = function(o,field) {
	if(!Object.prototype.hasOwnProperty.call(o,field)) return false;
	delete(o[field]);
	return true;
};
var Std = $hxClasses["Std"] = function() { };
Std.__name__ = ["Std"];
Std["is"] = function(v,t) {
	return js.Boot.__instanceof(v,t);
};
Std.string = function(s) {
	return js.Boot.__string_rec(s,"");
};
Std.parseInt = function(x) {
	var v = parseInt(x,10);
	if(v == 0 && (HxOverrides.cca(x,1) == 120 || HxOverrides.cca(x,1) == 88)) v = parseInt(x);
	if(isNaN(v)) return null;
	return v;
};
Std.parseFloat = function(x) {
	return parseFloat(x);
};
var StringBuf = $hxClasses["StringBuf"] = function() {
	this.b = "";
};
StringBuf.__name__ = ["StringBuf"];
StringBuf.prototype = {
	b: null
	,add: function(x) {
		this.b += Std.string(x);
	}
	,toString: function() {
		return this.b;
	}
	,__class__: StringBuf
};
var StringTools = $hxClasses["StringTools"] = function() { };
StringTools.__name__ = ["StringTools"];
StringTools.startsWith = function(s,start) {
	return s.length >= start.length && HxOverrides.substr(s,0,start.length) == start;
};
StringTools.replace = function(s,sub,by) {
	return s.split(sub).join(by);
};
StringTools.fastCodeAt = function(s,index) {
	return s.charCodeAt(index);
};
var ValueType = $hxClasses["ValueType"] = { __ename__ : ["ValueType"], __constructs__ : ["TNull","TInt","TFloat","TBool","TObject","TFunction","TClass","TEnum","TUnknown"] };
ValueType.TNull = ["TNull",0];
ValueType.TNull.toString = $estr;
ValueType.TNull.__enum__ = ValueType;
ValueType.TInt = ["TInt",1];
ValueType.TInt.toString = $estr;
ValueType.TInt.__enum__ = ValueType;
ValueType.TFloat = ["TFloat",2];
ValueType.TFloat.toString = $estr;
ValueType.TFloat.__enum__ = ValueType;
ValueType.TBool = ["TBool",3];
ValueType.TBool.toString = $estr;
ValueType.TBool.__enum__ = ValueType;
ValueType.TObject = ["TObject",4];
ValueType.TObject.toString = $estr;
ValueType.TObject.__enum__ = ValueType;
ValueType.TFunction = ["TFunction",5];
ValueType.TFunction.toString = $estr;
ValueType.TFunction.__enum__ = ValueType;
ValueType.TClass = function(c) { var $x = ["TClass",6,c]; $x.__enum__ = ValueType; $x.toString = $estr; return $x; };
ValueType.TEnum = function(e) { var $x = ["TEnum",7,e]; $x.__enum__ = ValueType; $x.toString = $estr; return $x; };
ValueType.TUnknown = ["TUnknown",8];
ValueType.TUnknown.toString = $estr;
ValueType.TUnknown.__enum__ = ValueType;
var Type = $hxClasses["Type"] = function() { };
Type.__name__ = ["Type"];
Type.getClass = function(o) {
	if(o == null) return null; else return js.Boot.getClass(o);
};
Type.getClassName = function(c) {
	var a = c.__name__;
	if(a == null) return null;
	return a.join(".");
};
Type.getEnumName = function(e) {
	var a = e.__ename__;
	return a.join(".");
};
Type.resolveClass = function(name) {
	var cl = $hxClasses[name];
	if(cl == null || !cl.__name__) return null;
	return cl;
};
Type.resolveEnum = function(name) {
	var e = $hxClasses[name];
	if(e == null || !e.__ename__) return null;
	return e;
};
Type.createInstance = function(cl,args) {
	var _g = args.length;
	switch(_g) {
	case 0:
		return new cl();
	case 1:
		return new cl(args[0]);
	case 2:
		return new cl(args[0],args[1]);
	case 3:
		return new cl(args[0],args[1],args[2]);
	case 4:
		return new cl(args[0],args[1],args[2],args[3]);
	case 5:
		return new cl(args[0],args[1],args[2],args[3],args[4]);
	case 6:
		return new cl(args[0],args[1],args[2],args[3],args[4],args[5]);
	case 7:
		return new cl(args[0],args[1],args[2],args[3],args[4],args[5],args[6]);
	case 8:
		return new cl(args[0],args[1],args[2],args[3],args[4],args[5],args[6],args[7]);
	default:
		throw new js._Boot.HaxeError("Too many arguments");
	}
	return null;
};
Type.createEmptyInstance = function(cl) {
	function empty() {}; empty.prototype = cl.prototype;
	return new empty();
};
Type.createEnum = function(e,constr,params) {
	var f = Reflect.field(e,constr);
	if(f == null) throw new js._Boot.HaxeError("No such constructor " + constr);
	if(Reflect.isFunction(f)) {
		if(params == null) throw new js._Boot.HaxeError("Constructor " + constr + " need parameters");
		return Reflect.callMethod(e,f,params);
	}
	if(params != null && params.length != 0) throw new js._Boot.HaxeError("Constructor " + constr + " does not need parameters");
	return f;
};
Type.getInstanceFields = function(c) {
	var a = [];
	for(var i in c.prototype) a.push(i);
	HxOverrides.remove(a,"__class__");
	HxOverrides.remove(a,"__properties__");
	return a;
};
Type.getEnumConstructs = function(e) {
	var a = e.__constructs__;
	return a.slice();
};
Type["typeof"] = function(v) {
	var _g = typeof(v);
	switch(_g) {
	case "boolean":
		return ValueType.TBool;
	case "string":
		return ValueType.TClass(String);
	case "number":
		if(Math.ceil(v) == v % 2147483648.0) return ValueType.TInt;
		return ValueType.TFloat;
	case "object":
		if(v == null) return ValueType.TNull;
		var e = v.__enum__;
		if(e != null) return ValueType.TEnum(e);
		var c = js.Boot.getClass(v);
		if(c != null) return ValueType.TClass(c);
		return ValueType.TObject;
	case "function":
		if(v.__name__ || v.__ename__) return ValueType.TObject;
		return ValueType.TFunction;
	case "undefined":
		return ValueType.TNull;
	default:
		return ValueType.TUnknown;
	}
};
var bindings = bindings || {};
bindings.NodeSocket = $hxClasses["bindings.NodeSocket"] = function(nativeSocket) {
	this.theNativeSocket = nativeSocket;
};
bindings.NodeSocket.__name__ = ["bindings","NodeSocket"];
bindings.NodeSocket.prototype = {
	theNativeSocket: null
	,id: null
	,on: function(command,func) {
		this.theNativeSocket.on(command,func);
	}
	,emit: function(command,obj) {
		this.theNativeSocket.emit(command,obj);
	}
	,getId: function() {
		return this.theNativeSocket.id;
	}
	,disconnect: function() {
		this.theNativeSocket.disconnect();
	}
	,__class__: bindings.NodeSocket
};
bindings.NodeFSExtra = $hxClasses["bindings.NodeFSExtra"] = function() { };
bindings.NodeFSExtra.__name__ = ["bindings","NodeFSExtra"];
bindings.NodeFSExtra.copy = function(src,dest,cb) {
	bindings.NodeFSExtra.fsExtra.copy(src,dest,cb);
	return;
};
bindings.NodeTemp = $hxClasses["bindings.NodeTemp"] = function() { };
bindings.NodeTemp.__name__ = ["bindings","NodeTemp"];
bindings.NodeTemp.open = function(prefix,cb) {
	return bindings.NodeTemp.temp.open(prefix,cb);
};
var com = com || {};
if(!com.dongxiguo) com.dongxiguo = {};
if(!com.dongxiguo.continuation) com.dongxiguo.continuation = {};
com.dongxiguo.continuation.Continuation = $hxClasses["com.dongxiguo.continuation.Continuation"] = function() { };
com.dongxiguo.continuation.Continuation.__name__ = ["com","dongxiguo","continuation","Continuation"];
com.dongxiguo.continuation.ContinuationDetail = $hxClasses["com.dongxiguo.continuation.ContinuationDetail"] = function() { };
com.dongxiguo.continuation.ContinuationDetail.__name__ = ["com","dongxiguo","continuation","ContinuationDetail"];
var haxe = haxe || {};
haxe.IMap = $hxClasses["haxe.IMap"] = function() { };
haxe.IMap.__name__ = ["haxe","IMap"];
haxe.IMap.prototype = {
	get: null
	,set: null
	,exists: null
	,remove: null
	,keys: null
	,iterator: null
	,__class__: haxe.IMap
};
haxe.Json = $hxClasses["haxe.Json"] = function() { };
haxe.Json.__name__ = ["haxe","Json"];
haxe.Json.stringify = function(obj,replacer,insertion) {
	return JSON.stringify(obj,replacer,insertion);
};
haxe.Json.parse = function(jsonString) {
	return JSON.parse(jsonString);
};
haxe.Serializer = $hxClasses["haxe.Serializer"] = function() {
	this.buf = new StringBuf();
	this.cache = [];
	this.useCache = haxe.Serializer.USE_CACHE;
	this.useEnumIndex = haxe.Serializer.USE_ENUM_INDEX;
	this.shash = new haxe.ds.StringMap();
	this.scount = 0;
};
haxe.Serializer.__name__ = ["haxe","Serializer"];
haxe.Serializer.run = function(v) {
	var s = new haxe.Serializer();
	s.serialize(v);
	return s.toString();
};
haxe.Serializer.prototype = {
	buf: null
	,cache: null
	,shash: null
	,scount: null
	,useCache: null
	,useEnumIndex: null
	,toString: function() {
		return this.buf.b;
	}
	,serializeString: function(s) {
		var x = this.shash.get(s);
		if(x != null) {
			this.buf.b += "R";
			if(x == null) this.buf.b += "null"; else this.buf.b += "" + x;
			return;
		}
		this.shash.set(s,this.scount++);
		this.buf.b += "y";
		s = encodeURIComponent(s);
		if(s.length == null) this.buf.b += "null"; else this.buf.b += "" + s.length;
		this.buf.b += ":";
		if(s == null) this.buf.b += "null"; else this.buf.b += "" + s;
	}
	,serializeRef: function(v) {
		var vt = typeof(v);
		var _g1 = 0;
		var _g = this.cache.length;
		while(_g1 < _g) {
			var i = _g1++;
			var ci = this.cache[i];
			if(typeof(ci) == vt && ci == v) {
				this.buf.b += "r";
				if(i == null) this.buf.b += "null"; else this.buf.b += "" + i;
				return true;
			}
		}
		this.cache.push(v);
		return false;
	}
	,serializeFields: function(v) {
		var _g = 0;
		var _g1 = Reflect.fields(v);
		while(_g < _g1.length) {
			var f = _g1[_g];
			++_g;
			this.serializeString(f);
			this.serialize(Reflect.field(v,f));
		}
		this.buf.b += "g";
	}
	,serialize: function(v) {
		{
			var _g = Type["typeof"](v);
			switch(_g[1]) {
			case 0:
				this.buf.b += "n";
				break;
			case 1:
				var v1 = v;
				if(v1 == 0) {
					this.buf.b += "z";
					return;
				}
				this.buf.b += "i";
				if(v1 == null) this.buf.b += "null"; else this.buf.b += "" + v1;
				break;
			case 2:
				var v2 = v;
				if(isNaN(v2)) this.buf.b += "k"; else if(!isFinite(v2)) if(v2 < 0) this.buf.b += "m"; else this.buf.b += "p"; else {
					this.buf.b += "d";
					if(v2 == null) this.buf.b += "null"; else this.buf.b += "" + v2;
				}
				break;
			case 3:
				if(v) this.buf.b += "t"; else this.buf.b += "f";
				break;
			case 6:
				var c = _g[2];
				if(c == String) {
					this.serializeString(v);
					return;
				}
				if(this.useCache && this.serializeRef(v)) return;
				switch(c) {
				case Array:
					var ucount = 0;
					this.buf.b += "a";
					var l = v.length;
					var _g1 = 0;
					while(_g1 < l) {
						var i = _g1++;
						if(v[i] == null) ucount++; else {
							if(ucount > 0) {
								if(ucount == 1) this.buf.b += "n"; else {
									this.buf.b += "u";
									if(ucount == null) this.buf.b += "null"; else this.buf.b += "" + ucount;
								}
								ucount = 0;
							}
							this.serialize(v[i]);
						}
					}
					if(ucount > 0) {
						if(ucount == 1) this.buf.b += "n"; else {
							this.buf.b += "u";
							if(ucount == null) this.buf.b += "null"; else this.buf.b += "" + ucount;
						}
					}
					this.buf.b += "h";
					break;
				case List:
					this.buf.b += "l";
					var v3 = v;
					var _g1_head = v3.h;
					var _g1_val = null;
					while(_g1_head != null) {
						var i1;
						_g1_val = _g1_head[0];
						_g1_head = _g1_head[1];
						i1 = _g1_val;
						this.serialize(i1);
					}
					this.buf.b += "h";
					break;
				case Date:
					var d = v;
					this.buf.b += "v";
					this.buf.add(d.getTime());
					break;
				case haxe.ds.StringMap:
					this.buf.b += "b";
					var v4 = v;
					var $it0 = v4.keys();
					while( $it0.hasNext() ) {
						var k = $it0.next();
						this.serializeString(k);
						this.serialize(__map_reserved[k] != null?v4.getReserved(k):v4.h[k]);
					}
					this.buf.b += "h";
					break;
				case haxe.ds.IntMap:
					this.buf.b += "q";
					var v5 = v;
					var $it1 = v5.keys();
					while( $it1.hasNext() ) {
						var k1 = $it1.next();
						this.buf.b += ":";
						if(k1 == null) this.buf.b += "null"; else this.buf.b += "" + k1;
						this.serialize(v5.h[k1]);
					}
					this.buf.b += "h";
					break;
				case haxe.ds.ObjectMap:
					this.buf.b += "M";
					var v6 = v;
					var $it2 = v6.keys();
					while( $it2.hasNext() ) {
						var k2 = $it2.next();
						var id = Reflect.field(k2,"__id__");
						Reflect.deleteField(k2,"__id__");
						this.serialize(k2);
						k2.__id__ = id;
						this.serialize(v6.h[k2.__id__]);
					}
					this.buf.b += "h";
					break;
				case haxe.io.Bytes:
					var v7 = v;
					var i2 = 0;
					var max = v7.length - 2;
					var charsBuf = new StringBuf();
					var b64 = haxe.Serializer.BASE64;
					while(i2 < max) {
						var b1 = v7.get(i2++);
						var b2 = v7.get(i2++);
						var b3 = v7.get(i2++);
						charsBuf.add(b64.charAt(b1 >> 2));
						charsBuf.add(b64.charAt((b1 << 4 | b2 >> 4) & 63));
						charsBuf.add(b64.charAt((b2 << 2 | b3 >> 6) & 63));
						charsBuf.add(b64.charAt(b3 & 63));
					}
					if(i2 == max) {
						var b11 = v7.get(i2++);
						var b21 = v7.get(i2++);
						charsBuf.add(b64.charAt(b11 >> 2));
						charsBuf.add(b64.charAt((b11 << 4 | b21 >> 4) & 63));
						charsBuf.add(b64.charAt(b21 << 2 & 63));
					} else if(i2 == max + 1) {
						var b12 = v7.get(i2++);
						charsBuf.add(b64.charAt(b12 >> 2));
						charsBuf.add(b64.charAt(b12 << 4 & 63));
					}
					var chars = charsBuf.b;
					this.buf.b += "s";
					if(chars.length == null) this.buf.b += "null"; else this.buf.b += "" + chars.length;
					this.buf.b += ":";
					if(chars == null) this.buf.b += "null"; else this.buf.b += "" + chars;
					break;
				default:
					if(this.useCache) this.cache.pop();
					if(v.hxSerialize != null) {
						this.buf.b += "C";
						this.serializeString(Type.getClassName(c));
						if(this.useCache) this.cache.push(v);
						v.hxSerialize(this);
						this.buf.b += "g";
					} else {
						this.buf.b += "c";
						this.serializeString(Type.getClassName(c));
						if(this.useCache) this.cache.push(v);
						this.serializeFields(v);
					}
				}
				break;
			case 4:
				if(js.Boot.__instanceof(v,Class)) {
					var className = Type.getClassName(v);
					this.buf.b += "A";
					this.serializeString(className);
				} else if(js.Boot.__instanceof(v,Enum)) {
					this.buf.b += "B";
					this.serializeString(Type.getEnumName(v));
				} else {
					if(this.useCache && this.serializeRef(v)) return;
					this.buf.b += "o";
					this.serializeFields(v);
				}
				break;
			case 7:
				var e = _g[2];
				if(this.useCache) {
					if(this.serializeRef(v)) return;
					this.cache.pop();
				}
				if(this.useEnumIndex) this.buf.b += "j"; else this.buf.b += "w";
				this.serializeString(Type.getEnumName(e));
				if(this.useEnumIndex) {
					this.buf.b += ":";
					this.buf.b += Std.string(v[1]);
				} else this.serializeString(v[0]);
				this.buf.b += ":";
				var l1 = v.length;
				this.buf.b += Std.string(l1 - 2);
				var _g11 = 2;
				while(_g11 < l1) {
					var i3 = _g11++;
					this.serialize(v[i3]);
				}
				if(this.useCache) this.cache.push(v);
				break;
			case 5:
				throw new js._Boot.HaxeError("Cannot serialize function");
				break;
			default:
				throw new js._Boot.HaxeError("Cannot serialize " + Std.string(v));
			}
		}
	}
	,__class__: haxe.Serializer
};
haxe.Timer = $hxClasses["haxe.Timer"] = function(time_ms) {
	var me = this;
	this.id = setInterval(function() {
		me.run();
	},time_ms);
};
haxe.Timer.__name__ = ["haxe","Timer"];
haxe.Timer.delay = function(f,time_ms) {
	var t = new haxe.Timer(time_ms);
	t.run = function() {
		t.stop();
		f();
	};
	return t;
};
haxe.Timer.prototype = {
	id: null
	,stop: function() {
		if(this.id == null) return;
		clearInterval(this.id);
		this.id = null;
	}
	,run: function() {
	}
	,__class__: haxe.Timer
};
haxe.Unserializer = $hxClasses["haxe.Unserializer"] = function(buf) {
	this.buf = buf;
	this.length = buf.length;
	this.pos = 0;
	this.scache = [];
	this.cache = [];
	var r = haxe.Unserializer.DEFAULT_RESOLVER;
	if(r == null) {
		r = Type;
		haxe.Unserializer.DEFAULT_RESOLVER = r;
	}
	this.setResolver(r);
};
haxe.Unserializer.__name__ = ["haxe","Unserializer"];
haxe.Unserializer.initCodes = function() {
	var codes = [];
	var _g1 = 0;
	var _g = haxe.Unserializer.BASE64.length;
	while(_g1 < _g) {
		var i = _g1++;
		codes[haxe.Unserializer.BASE64.charCodeAt(i)] = i;
	}
	return codes;
};
haxe.Unserializer.run = function(v) {
	return new haxe.Unserializer(v).unserialize();
};
haxe.Unserializer.prototype = {
	buf: null
	,pos: null
	,length: null
	,cache: null
	,scache: null
	,resolver: null
	,setResolver: function(r) {
		if(r == null) this.resolver = { resolveClass : function(_) {
			return null;
		}, resolveEnum : function(_1) {
			return null;
		}}; else this.resolver = r;
	}
	,get: function(p) {
		return this.buf.charCodeAt(p);
	}
	,readDigits: function() {
		var k = 0;
		var s = false;
		var fpos = this.pos;
		while(true) {
			var c = this.buf.charCodeAt(this.pos);
			if(c != c) break;
			if(c == 45) {
				if(this.pos != fpos) break;
				s = true;
				this.pos++;
				continue;
			}
			if(c < 48 || c > 57) break;
			k = k * 10 + (c - 48);
			this.pos++;
		}
		if(s) k *= -1;
		return k;
	}
	,readFloat: function() {
		var p1 = this.pos;
		while(true) {
			var c = this.buf.charCodeAt(this.pos);
			if(c >= 43 && c < 58 || c == 101 || c == 69) this.pos++; else break;
		}
		return Std.parseFloat(HxOverrides.substr(this.buf,p1,this.pos - p1));
	}
	,unserializeObject: function(o) {
		while(true) {
			if(this.pos >= this.length) throw new js._Boot.HaxeError("Invalid object");
			if(this.buf.charCodeAt(this.pos) == 103) break;
			var k = this.unserialize();
			if(!(typeof(k) == "string")) throw new js._Boot.HaxeError("Invalid object key");
			var v = this.unserialize();
			o[k] = v;
		}
		this.pos++;
	}
	,unserializeEnum: function(edecl,tag) {
		if(this.get(this.pos++) != 58) throw new js._Boot.HaxeError("Invalid enum format");
		var nargs = this.readDigits();
		if(nargs == 0) return Type.createEnum(edecl,tag);
		var args = [];
		while(nargs-- > 0) args.push(this.unserialize());
		return Type.createEnum(edecl,tag,args);
	}
	,unserialize: function() {
		var _g = this.get(this.pos++);
		switch(_g) {
		case 110:
			return null;
		case 116:
			return true;
		case 102:
			return false;
		case 122:
			return 0;
		case 105:
			return this.readDigits();
		case 100:
			return this.readFloat();
		case 121:
			var len = this.readDigits();
			if(this.get(this.pos++) != 58 || this.length - this.pos < len) throw new js._Boot.HaxeError("Invalid string length");
			var s = HxOverrides.substr(this.buf,this.pos,len);
			this.pos += len;
			s = decodeURIComponent(s.split("+").join(" "));
			this.scache.push(s);
			return s;
		case 107:
			return NaN;
		case 109:
			return -Infinity;
		case 112:
			return Infinity;
		case 97:
			var buf = this.buf;
			var a = [];
			this.cache.push(a);
			while(true) {
				var c = this.buf.charCodeAt(this.pos);
				if(c == 104) {
					this.pos++;
					break;
				}
				if(c == 117) {
					this.pos++;
					var n = this.readDigits();
					a[a.length + n - 1] = null;
				} else a.push(this.unserialize());
			}
			return a;
		case 111:
			var o = { };
			this.cache.push(o);
			this.unserializeObject(o);
			return o;
		case 114:
			var n1 = this.readDigits();
			if(n1 < 0 || n1 >= this.cache.length) throw new js._Boot.HaxeError("Invalid reference");
			return this.cache[n1];
		case 82:
			var n2 = this.readDigits();
			if(n2 < 0 || n2 >= this.scache.length) throw new js._Boot.HaxeError("Invalid string reference");
			return this.scache[n2];
		case 120:
			throw new js._Boot.HaxeError(this.unserialize());
			break;
		case 99:
			var name = this.unserialize();
			var cl = this.resolver.resolveClass(name);
			if(cl == null) throw new js._Boot.HaxeError("Class not found " + name);
			var o1 = Type.createEmptyInstance(cl);
			this.cache.push(o1);
			this.unserializeObject(o1);
			return o1;
		case 119:
			var name1 = this.unserialize();
			var edecl = this.resolver.resolveEnum(name1);
			if(edecl == null) throw new js._Boot.HaxeError("Enum not found " + name1);
			var e = this.unserializeEnum(edecl,this.unserialize());
			this.cache.push(e);
			return e;
		case 106:
			var name2 = this.unserialize();
			var edecl1 = this.resolver.resolveEnum(name2);
			if(edecl1 == null) throw new js._Boot.HaxeError("Enum not found " + name2);
			this.pos++;
			var index = this.readDigits();
			var tag = Type.getEnumConstructs(edecl1)[index];
			if(tag == null) throw new js._Boot.HaxeError("Unknown enum index " + name2 + "@" + index);
			var e1 = this.unserializeEnum(edecl1,tag);
			this.cache.push(e1);
			return e1;
		case 108:
			var l = new List();
			this.cache.push(l);
			var buf1 = this.buf;
			while(this.buf.charCodeAt(this.pos) != 104) l.add(this.unserialize());
			this.pos++;
			return l;
		case 98:
			var h = new haxe.ds.StringMap();
			this.cache.push(h);
			var buf2 = this.buf;
			while(this.buf.charCodeAt(this.pos) != 104) {
				var s1 = this.unserialize();
				h.set(s1,this.unserialize());
			}
			this.pos++;
			return h;
		case 113:
			var h1 = new haxe.ds.IntMap();
			this.cache.push(h1);
			var buf3 = this.buf;
			var c1 = this.get(this.pos++);
			while(c1 == 58) {
				var i = this.readDigits();
				h1.set(i,this.unserialize());
				c1 = this.get(this.pos++);
			}
			if(c1 != 104) throw new js._Boot.HaxeError("Invalid IntMap format");
			return h1;
		case 77:
			var h2 = new haxe.ds.ObjectMap();
			this.cache.push(h2);
			var buf4 = this.buf;
			while(this.buf.charCodeAt(this.pos) != 104) {
				var s2 = this.unserialize();
				h2.set(s2,this.unserialize());
			}
			this.pos++;
			return h2;
		case 118:
			var d;
			if(this.buf.charCodeAt(this.pos) >= 48 && this.buf.charCodeAt(this.pos) <= 57 && this.buf.charCodeAt(this.pos + 1) >= 48 && this.buf.charCodeAt(this.pos + 1) <= 57 && this.buf.charCodeAt(this.pos + 2) >= 48 && this.buf.charCodeAt(this.pos + 2) <= 57 && this.buf.charCodeAt(this.pos + 3) >= 48 && this.buf.charCodeAt(this.pos + 3) <= 57 && this.buf.charCodeAt(this.pos + 4) == 45) {
				var s3 = HxOverrides.substr(this.buf,this.pos,19);
				d = HxOverrides.strDate(s3);
				this.pos += 19;
			} else {
				var t = this.readFloat();
				var d1 = new Date();
				d1.setTime(t);
				d = d1;
			}
			this.cache.push(d);
			return d;
		case 115:
			var len1 = this.readDigits();
			var buf5 = this.buf;
			if(this.get(this.pos++) != 58 || this.length - this.pos < len1) throw new js._Boot.HaxeError("Invalid bytes length");
			var codes = haxe.Unserializer.CODES;
			if(codes == null) {
				codes = haxe.Unserializer.initCodes();
				haxe.Unserializer.CODES = codes;
			}
			var i1 = this.pos;
			var rest = len1 & 3;
			var size;
			size = (len1 >> 2) * 3 + (rest >= 2?rest - 1:0);
			var max = i1 + (len1 - rest);
			var bytes = haxe.io.Bytes.alloc(size);
			var bpos = 0;
			while(i1 < max) {
				var c11 = codes[StringTools.fastCodeAt(buf5,i1++)];
				var c2 = codes[StringTools.fastCodeAt(buf5,i1++)];
				bytes.set(bpos++,c11 << 2 | c2 >> 4);
				var c3 = codes[StringTools.fastCodeAt(buf5,i1++)];
				bytes.set(bpos++,c2 << 4 | c3 >> 2);
				var c4 = codes[StringTools.fastCodeAt(buf5,i1++)];
				bytes.set(bpos++,c3 << 6 | c4);
			}
			if(rest >= 2) {
				var c12 = codes[StringTools.fastCodeAt(buf5,i1++)];
				var c21 = codes[StringTools.fastCodeAt(buf5,i1++)];
				bytes.set(bpos++,c12 << 2 | c21 >> 4);
				if(rest == 3) {
					var c31 = codes[StringTools.fastCodeAt(buf5,i1++)];
					bytes.set(bpos++,c21 << 4 | c31 >> 2);
				}
			}
			this.pos += len1;
			this.cache.push(bytes);
			return bytes;
		case 67:
			var name3 = this.unserialize();
			var cl1 = this.resolver.resolveClass(name3);
			if(cl1 == null) throw new js._Boot.HaxeError("Class not found " + name3);
			var o2 = Type.createEmptyInstance(cl1);
			this.cache.push(o2);
			o2.hxUnserialize(this);
			if(this.get(this.pos++) != 103) throw new js._Boot.HaxeError("Invalid custom data");
			return o2;
		case 65:
			var name4 = this.unserialize();
			var cl2 = this.resolver.resolveClass(name4);
			if(cl2 == null) throw new js._Boot.HaxeError("Class not found " + name4);
			return cl2;
		case 66:
			var name5 = this.unserialize();
			var e2 = this.resolver.resolveEnum(name5);
			if(e2 == null) throw new js._Boot.HaxeError("Enum not found " + name5);
			return e2;
		default:
		}
		this.pos--;
		throw new js._Boot.HaxeError("Invalid char " + this.buf.charAt(this.pos) + " at position " + this.pos);
	}
	,__class__: haxe.Unserializer
};
if(!haxe.crypto) haxe.crypto = {};
haxe.crypto.Md5 = $hxClasses["haxe.crypto.Md5"] = function() {
};
haxe.crypto.Md5.__name__ = ["haxe","crypto","Md5"];
haxe.crypto.Md5.encode = function(s) {
	var m = new haxe.crypto.Md5();
	var h = m.doEncode(haxe.crypto.Md5.str2blks(s));
	return m.hex(h);
};
haxe.crypto.Md5.str2blks = function(str) {
	var nblk = (str.length + 8 >> 6) + 1;
	var blks = [];
	var blksSize = nblk * 16;
	var _g = 0;
	while(_g < blksSize) {
		var i1 = _g++;
		blks[i1] = 0;
	}
	var i = 0;
	while(i < str.length) {
		blks[i >> 2] |= HxOverrides.cca(str,i) << (str.length * 8 + i) % 4 * 8;
		i++;
	}
	blks[i >> 2] |= 128 << (str.length * 8 + i) % 4 * 8;
	var l = str.length * 8;
	var k = nblk * 16 - 2;
	blks[k] = l & 255;
	blks[k] |= (l >>> 8 & 255) << 8;
	blks[k] |= (l >>> 16 & 255) << 16;
	blks[k] |= (l >>> 24 & 255) << 24;
	return blks;
};
haxe.crypto.Md5.prototype = {
	bitOR: function(a,b) {
		var lsb = a & 1 | b & 1;
		var msb31 = a >>> 1 | b >>> 1;
		return msb31 << 1 | lsb;
	}
	,bitXOR: function(a,b) {
		var lsb = a & 1 ^ b & 1;
		var msb31 = a >>> 1 ^ b >>> 1;
		return msb31 << 1 | lsb;
	}
	,bitAND: function(a,b) {
		var lsb = a & 1 & (b & 1);
		var msb31 = a >>> 1 & b >>> 1;
		return msb31 << 1 | lsb;
	}
	,addme: function(x,y) {
		var lsw = (x & 65535) + (y & 65535);
		var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
		return msw << 16 | lsw & 65535;
	}
	,hex: function(a) {
		var str = "";
		var hex_chr = "0123456789abcdef";
		var _g = 0;
		while(_g < a.length) {
			var num = a[_g];
			++_g;
			var _g1 = 0;
			while(_g1 < 4) {
				var j = _g1++;
				str += hex_chr.charAt(num >> j * 8 + 4 & 15) + hex_chr.charAt(num >> j * 8 & 15);
			}
		}
		return str;
	}
	,rol: function(num,cnt) {
		return num << cnt | num >>> 32 - cnt;
	}
	,cmn: function(q,a,b,x,s,t) {
		return this.addme(this.rol(this.addme(this.addme(a,q),this.addme(x,t)),s),b);
	}
	,ff: function(a,b,c,d,x,s,t) {
		return this.cmn(this.bitOR(this.bitAND(b,c),this.bitAND(~b,d)),a,b,x,s,t);
	}
	,gg: function(a,b,c,d,x,s,t) {
		return this.cmn(this.bitOR(this.bitAND(b,d),this.bitAND(c,~d)),a,b,x,s,t);
	}
	,hh: function(a,b,c,d,x,s,t) {
		return this.cmn(this.bitXOR(this.bitXOR(b,c),d),a,b,x,s,t);
	}
	,ii: function(a,b,c,d,x,s,t) {
		return this.cmn(this.bitXOR(c,this.bitOR(b,~d)),a,b,x,s,t);
	}
	,doEncode: function(x) {
		var a = 1732584193;
		var b = -271733879;
		var c = -1732584194;
		var d = 271733878;
		var step;
		var i = 0;
		while(i < x.length) {
			var olda = a;
			var oldb = b;
			var oldc = c;
			var oldd = d;
			step = 0;
			a = this.ff(a,b,c,d,x[i],7,-680876936);
			d = this.ff(d,a,b,c,x[i + 1],12,-389564586);
			c = this.ff(c,d,a,b,x[i + 2],17,606105819);
			b = this.ff(b,c,d,a,x[i + 3],22,-1044525330);
			a = this.ff(a,b,c,d,x[i + 4],7,-176418897);
			d = this.ff(d,a,b,c,x[i + 5],12,1200080426);
			c = this.ff(c,d,a,b,x[i + 6],17,-1473231341);
			b = this.ff(b,c,d,a,x[i + 7],22,-45705983);
			a = this.ff(a,b,c,d,x[i + 8],7,1770035416);
			d = this.ff(d,a,b,c,x[i + 9],12,-1958414417);
			c = this.ff(c,d,a,b,x[i + 10],17,-42063);
			b = this.ff(b,c,d,a,x[i + 11],22,-1990404162);
			a = this.ff(a,b,c,d,x[i + 12],7,1804603682);
			d = this.ff(d,a,b,c,x[i + 13],12,-40341101);
			c = this.ff(c,d,a,b,x[i + 14],17,-1502002290);
			b = this.ff(b,c,d,a,x[i + 15],22,1236535329);
			a = this.gg(a,b,c,d,x[i + 1],5,-165796510);
			d = this.gg(d,a,b,c,x[i + 6],9,-1069501632);
			c = this.gg(c,d,a,b,x[i + 11],14,643717713);
			b = this.gg(b,c,d,a,x[i],20,-373897302);
			a = this.gg(a,b,c,d,x[i + 5],5,-701558691);
			d = this.gg(d,a,b,c,x[i + 10],9,38016083);
			c = this.gg(c,d,a,b,x[i + 15],14,-660478335);
			b = this.gg(b,c,d,a,x[i + 4],20,-405537848);
			a = this.gg(a,b,c,d,x[i + 9],5,568446438);
			d = this.gg(d,a,b,c,x[i + 14],9,-1019803690);
			c = this.gg(c,d,a,b,x[i + 3],14,-187363961);
			b = this.gg(b,c,d,a,x[i + 8],20,1163531501);
			a = this.gg(a,b,c,d,x[i + 13],5,-1444681467);
			d = this.gg(d,a,b,c,x[i + 2],9,-51403784);
			c = this.gg(c,d,a,b,x[i + 7],14,1735328473);
			b = this.gg(b,c,d,a,x[i + 12],20,-1926607734);
			a = this.hh(a,b,c,d,x[i + 5],4,-378558);
			d = this.hh(d,a,b,c,x[i + 8],11,-2022574463);
			c = this.hh(c,d,a,b,x[i + 11],16,1839030562);
			b = this.hh(b,c,d,a,x[i + 14],23,-35309556);
			a = this.hh(a,b,c,d,x[i + 1],4,-1530992060);
			d = this.hh(d,a,b,c,x[i + 4],11,1272893353);
			c = this.hh(c,d,a,b,x[i + 7],16,-155497632);
			b = this.hh(b,c,d,a,x[i + 10],23,-1094730640);
			a = this.hh(a,b,c,d,x[i + 13],4,681279174);
			d = this.hh(d,a,b,c,x[i],11,-358537222);
			c = this.hh(c,d,a,b,x[i + 3],16,-722521979);
			b = this.hh(b,c,d,a,x[i + 6],23,76029189);
			a = this.hh(a,b,c,d,x[i + 9],4,-640364487);
			d = this.hh(d,a,b,c,x[i + 12],11,-421815835);
			c = this.hh(c,d,a,b,x[i + 15],16,530742520);
			b = this.hh(b,c,d,a,x[i + 2],23,-995338651);
			a = this.ii(a,b,c,d,x[i],6,-198630844);
			d = this.ii(d,a,b,c,x[i + 7],10,1126891415);
			c = this.ii(c,d,a,b,x[i + 14],15,-1416354905);
			b = this.ii(b,c,d,a,x[i + 5],21,-57434055);
			a = this.ii(a,b,c,d,x[i + 12],6,1700485571);
			d = this.ii(d,a,b,c,x[i + 3],10,-1894986606);
			c = this.ii(c,d,a,b,x[i + 10],15,-1051523);
			b = this.ii(b,c,d,a,x[i + 1],21,-2054922799);
			a = this.ii(a,b,c,d,x[i + 8],6,1873313359);
			d = this.ii(d,a,b,c,x[i + 15],10,-30611744);
			c = this.ii(c,d,a,b,x[i + 6],15,-1560198380);
			b = this.ii(b,c,d,a,x[i + 13],21,1309151649);
			a = this.ii(a,b,c,d,x[i + 4],6,-145523070);
			d = this.ii(d,a,b,c,x[i + 11],10,-1120210379);
			c = this.ii(c,d,a,b,x[i + 2],15,718787259);
			b = this.ii(b,c,d,a,x[i + 9],21,-343485551);
			a = this.addme(a,olda);
			b = this.addme(b,oldb);
			c = this.addme(c,oldc);
			d = this.addme(d,oldd);
			i += 16;
		}
		return [a,b,c,d];
	}
	,__class__: haxe.crypto.Md5
};
if(!haxe.ds) haxe.ds = {};
haxe.ds.IntMap = $hxClasses["haxe.ds.IntMap"] = function() {
	this.h = { };
};
haxe.ds.IntMap.__name__ = ["haxe","ds","IntMap"];
haxe.ds.IntMap.__interfaces__ = [haxe.IMap];
haxe.ds.IntMap.prototype = {
	h: null
	,set: function(key,value) {
		this.h[key] = value;
	}
	,get: function(key) {
		return this.h[key];
	}
	,exists: function(key) {
		return this.h.hasOwnProperty(key);
	}
	,remove: function(key) {
		if(!this.h.hasOwnProperty(key)) return false;
		delete(this.h[key]);
		return true;
	}
	,keys: function() {
		var a = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) a.push(key | 0);
		}
		return HxOverrides.iter(a);
	}
	,iterator: function() {
		return { ref : this.h, it : this.keys(), hasNext : function() {
			return this.it.hasNext();
		}, next : function() {
			var i = this.it.next();
			return this.ref[i];
		}};
	}
	,__class__: haxe.ds.IntMap
};
haxe.ds.ObjectMap = $hxClasses["haxe.ds.ObjectMap"] = function() {
	this.h = { };
	this.h.__keys__ = { };
};
haxe.ds.ObjectMap.__name__ = ["haxe","ds","ObjectMap"];
haxe.ds.ObjectMap.__interfaces__ = [haxe.IMap];
haxe.ds.ObjectMap.prototype = {
	h: null
	,set: function(key,value) {
		var id = key.__id__ || (key.__id__ = ++haxe.ds.ObjectMap.count);
		this.h[id] = value;
		this.h.__keys__[id] = key;
	}
	,get: function(key) {
		return this.h[key.__id__];
	}
	,exists: function(key) {
		return this.h.__keys__[key.__id__] != null;
	}
	,remove: function(key) {
		var id = key.__id__;
		if(this.h.__keys__[id] == null) return false;
		delete(this.h[id]);
		delete(this.h.__keys__[id]);
		return true;
	}
	,keys: function() {
		var a = [];
		for( var key in this.h.__keys__ ) {
		if(this.h.hasOwnProperty(key)) a.push(this.h.__keys__[key]);
		}
		return HxOverrides.iter(a);
	}
	,iterator: function() {
		return { ref : this.h, it : this.keys(), hasNext : function() {
			return this.it.hasNext();
		}, next : function() {
			var i = this.it.next();
			return this.ref[i.__id__];
		}};
	}
	,__class__: haxe.ds.ObjectMap
};
if(!haxe.ds._StringMap) haxe.ds._StringMap = {};
haxe.ds._StringMap.StringMapIterator = $hxClasses["haxe.ds._StringMap.StringMapIterator"] = function(map,keys) {
	this.map = map;
	this.keys = keys;
	this.index = 0;
	this.count = keys.length;
};
haxe.ds._StringMap.StringMapIterator.__name__ = ["haxe","ds","_StringMap","StringMapIterator"];
haxe.ds._StringMap.StringMapIterator.prototype = {
	map: null
	,keys: null
	,index: null
	,count: null
	,hasNext: function() {
		return this.index < this.count;
	}
	,next: function() {
		return this.map.get(this.keys[this.index++]);
	}
	,__class__: haxe.ds._StringMap.StringMapIterator
};
haxe.ds.StringMap = $hxClasses["haxe.ds.StringMap"] = function() {
	this.h = { };
};
haxe.ds.StringMap.__name__ = ["haxe","ds","StringMap"];
haxe.ds.StringMap.__interfaces__ = [haxe.IMap];
haxe.ds.StringMap.prototype = {
	h: null
	,rh: null
	,set: function(key,value) {
		if(__map_reserved[key] != null) this.setReserved(key,value); else this.h[key] = value;
	}
	,get: function(key) {
		if(__map_reserved[key] != null) return this.getReserved(key);
		return this.h[key];
	}
	,exists: function(key) {
		if(__map_reserved[key] != null) return this.existsReserved(key);
		return this.h.hasOwnProperty(key);
	}
	,setReserved: function(key,value) {
		if(this.rh == null) this.rh = { };
		this.rh["$" + key] = value;
	}
	,getReserved: function(key) {
		if(this.rh == null) return null; else return this.rh["$" + key];
	}
	,existsReserved: function(key) {
		if(this.rh == null) return false;
		return this.rh.hasOwnProperty("$" + key);
	}
	,remove: function(key) {
		if(__map_reserved[key] != null) {
			key = "$" + key;
			if(this.rh == null || !this.rh.hasOwnProperty(key)) return false;
			delete(this.rh[key]);
			return true;
		} else {
			if(!this.h.hasOwnProperty(key)) return false;
			delete(this.h[key]);
			return true;
		}
	}
	,keys: function() {
		var _this = this.arrayKeys();
		return HxOverrides.iter(_this);
	}
	,arrayKeys: function() {
		var out = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) out.push(key);
		}
		if(this.rh != null) {
			for( var key in this.rh ) {
			if(key.charCodeAt(0) == 36) out.push(key.substr(1));
			}
		}
		return out;
	}
	,iterator: function() {
		return new haxe.ds._StringMap.StringMapIterator(this,this.arrayKeys());
	}
	,toString: function() {
		var s = new StringBuf();
		s.b += "{";
		var keys = this.arrayKeys();
		var _g1 = 0;
		var _g = keys.length;
		while(_g1 < _g) {
			var i = _g1++;
			var k = keys[i];
			if(k == null) s.b += "null"; else s.b += "" + k;
			s.b += " => ";
			s.add(Std.string(__map_reserved[k] != null?this.getReserved(k):this.h[k]));
			if(i < keys.length) s.b += ", ";
		}
		s.b += "}";
		return s.b;
	}
	,__class__: haxe.ds.StringMap
};
if(!haxe.io) haxe.io = {};
haxe.io.Bytes = $hxClasses["haxe.io.Bytes"] = function(length,b) {
	this.length = length;
	this.b = b;
};
haxe.io.Bytes.__name__ = ["haxe","io","Bytes"];
haxe.io.Bytes.alloc = function(length) {
	return new haxe.io.Bytes(length,new Buffer(length));
};
haxe.io.Bytes.ofString = function(s) {
	var nb = new Buffer(s,"utf8");
	return new haxe.io.Bytes(nb.length,nb);
};
haxe.io.Bytes.ofData = function(b) {
	return new haxe.io.Bytes(b.length,b);
};
haxe.io.Bytes.prototype = {
	length: null
	,b: null
	,get: function(pos) {
		return this.b[pos];
	}
	,set: function(pos,v) {
		this.b[pos] = v;
	}
	,blit: function(pos,src,srcpos,len) {
		if(pos < 0 || srcpos < 0 || len < 0 || pos + len > this.length || srcpos + len > src.length) throw new js._Boot.HaxeError(haxe.io.Error.OutsideBounds);
		src.b.copy(this.b,pos,srcpos,srcpos + len);
	}
	,sub: function(pos,len) {
		if(pos < 0 || len < 0 || pos + len > this.length) throw new js._Boot.HaxeError(haxe.io.Error.OutsideBounds);
		var nb = new Buffer(len);
		var slice = this.b.slice(pos,pos + len);
		slice.copy(nb,0,0,len);
		return new haxe.io.Bytes(len,nb);
	}
	,compare: function(other) {
		var b1 = this.b;
		var b2 = other.b;
		var len;
		if(this.length < other.length) len = this.length; else len = other.length;
		var _g = 0;
		while(_g < len) {
			var i = _g++;
			if(b1[i] != b2[i]) return b1[i] - b2[i];
		}
		return this.length - other.length;
	}
	,getString: function(pos,len) {
		if(pos < 0 || len < 0 || pos + len > this.length) throw new js._Boot.HaxeError(haxe.io.Error.OutsideBounds);
		var s = "";
		var b = this.b;
		var fcc = String.fromCharCode;
		var i = pos;
		var max = pos + len;
		while(i < max) {
			var c = b[i++];
			if(c < 128) {
				if(c == 0) break;
				s += fcc(c);
			} else if(c < 224) s += fcc((c & 63) << 6 | b[i++] & 127); else if(c < 240) {
				var c2 = b[i++];
				s += fcc((c & 31) << 12 | (c2 & 127) << 6 | b[i++] & 127);
			} else {
				var c21 = b[i++];
				var c3 = b[i++];
				s += fcc((c & 15) << 18 | (c21 & 127) << 12 | c3 << 6 & 127 | b[i++] & 127);
			}
		}
		return s;
	}
	,readString: function(pos,len) {
		return this.getString(pos,len);
	}
	,toString: function() {
		return this.getString(0,this.length);
	}
	,toHex: function() {
		var s_b = "";
		var chars = [];
		var str = "0123456789abcdef";
		var _g1 = 0;
		var _g = str.length;
		while(_g1 < _g) {
			var i = _g1++;
			chars.push(HxOverrides.cca(str,i));
		}
		var _g11 = 0;
		var _g2 = this.length;
		while(_g11 < _g2) {
			var i1 = _g11++;
			var c = this.b[i1];
			s_b += String.fromCharCode(chars[c >> 4]);
			s_b += String.fromCharCode(chars[c & 15]);
		}
		return s_b;
	}
	,getData: function() {
		return this.b;
	}
	,__class__: haxe.io.Bytes
};
haxe.io.Error = $hxClasses["haxe.io.Error"] = { __ename__ : ["haxe","io","Error"], __constructs__ : ["Blocked","Overflow","OutsideBounds","Custom"] };
haxe.io.Error.Blocked = ["Blocked",0];
haxe.io.Error.Blocked.toString = $estr;
haxe.io.Error.Blocked.__enum__ = haxe.io.Error;
haxe.io.Error.Overflow = ["Overflow",1];
haxe.io.Error.Overflow.toString = $estr;
haxe.io.Error.Overflow.__enum__ = haxe.io.Error;
haxe.io.Error.OutsideBounds = ["OutsideBounds",2];
haxe.io.Error.OutsideBounds.toString = $estr;
haxe.io.Error.OutsideBounds.__enum__ = haxe.io.Error;
haxe.io.Error.Custom = function(e) { var $x = ["Custom",3,e]; $x.__enum__ = haxe.io.Error; $x.toString = $estr; return $x; };
var js = js || {};
if(!js._Boot) js._Boot = {};
js._Boot.HaxeError = $hxClasses["js._Boot.HaxeError"] = function(val) {
	Error.call(this);
	this.val = val;
	this.message = String(val);
	if(Error.captureStackTrace) Error.captureStackTrace(this,js._Boot.HaxeError);
};
js._Boot.HaxeError.__name__ = ["js","_Boot","HaxeError"];
js._Boot.HaxeError.__super__ = Error;
js._Boot.HaxeError.prototype = $extend(Error.prototype,{
	val: null
	,__class__: js._Boot.HaxeError
});
js.Boot = $hxClasses["js.Boot"] = function() { };
js.Boot.__name__ = ["js","Boot"];
js.Boot.getClass = function(o) {
	if((o instanceof Array) && o.__enum__ == null) return Array; else {
		var cl = o.__class__;
		if(cl != null) return cl;
		var name = js.Boot.__nativeClassName(o);
		if(name != null) return js.Boot.__resolveNativeClass(name);
		return null;
	}
};
js.Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) return o[0];
				var str2 = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i1 = _g1++;
					if(i1 != 2) str2 += "," + js.Boot.__string_rec(o[i1],s); else str2 += js.Boot.__string_rec(o[i1],s);
				}
				return str2 + ")";
			}
			var l = o.length;
			var i;
			var str1 = "[";
			s += "\t";
			var _g2 = 0;
			while(_g2 < l) {
				var i2 = _g2++;
				str1 += (i2 > 0?",":"") + js.Boot.__string_rec(o[i2],s);
			}
			str1 += "]";
			return str1;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			return "???";
		}
		if(tostr != null && tostr != Object.toString && typeof(tostr) == "function") {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str.length != 2) str += ", \n";
		str += s + k + " : " + js.Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str += "\n" + s + "}";
		return str;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
};
js.Boot.__interfLoop = function(cc,cl) {
	if(cc == null) return false;
	if(cc == cl) return true;
	var intf = cc.__interfaces__;
	if(intf != null) {
		var _g1 = 0;
		var _g = intf.length;
		while(_g1 < _g) {
			var i = _g1++;
			var i1 = intf[i];
			if(i1 == cl || js.Boot.__interfLoop(i1,cl)) return true;
		}
	}
	return js.Boot.__interfLoop(cc.__super__,cl);
};
js.Boot.__instanceof = function(o,cl) {
	if(cl == null) return false;
	switch(cl) {
	case Int:
		return (o|0) === o;
	case Float:
		return typeof(o) == "number";
	case Bool:
		return typeof(o) == "boolean";
	case String:
		return typeof(o) == "string";
	case Array:
		return (o instanceof Array) && o.__enum__ == null;
	case Dynamic:
		return true;
	default:
		if(o != null) {
			if(typeof(cl) == "function") {
				if(o instanceof cl) return true;
				if(js.Boot.__interfLoop(js.Boot.getClass(o),cl)) return true;
			} else if(typeof(cl) == "object" && js.Boot.__isNativeObj(cl)) {
				if(o instanceof cl) return true;
			}
		} else return false;
		if(cl == Class && o.__name__ != null) return true;
		if(cl == Enum && o.__ename__ != null) return true;
		return o.__enum__ == cl;
	}
};
js.Boot.__cast = function(o,t) {
	if(js.Boot.__instanceof(o,t)) return o; else throw new js._Boot.HaxeError("Cannot cast " + Std.string(o) + " to " + Std.string(t));
};
js.Boot.__nativeClassName = function(o) {
	var name = js.Boot.__toStr.call(o).slice(8,-1);
	if(name == "Object" || name == "Function" || name == "Math" || name == "JSON") return null;
	return name;
};
js.Boot.__isNativeObj = function(o) {
	return js.Boot.__nativeClassName(o) != null;
};
js.Boot.__resolveNativeClass = function(name) {
	return $global[name];
};
js.NodeC = $hxClasses["js.NodeC"] = function() { };
js.NodeC.__name__ = ["js","NodeC"];
js.Node = $hxClasses["js.Node"] = function() { };
js.Node.__name__ = ["js","Node"];
js.Node.get_assert = function() {
	return js.Node.require("assert");
};
js.Node.get_child_process = function() {
	return js.Node.require("child_process");
};
js.Node.get_cluster = function() {
	return js.Node.require("cluster");
};
js.Node.get_crypto = function() {
	return js.Node.require("crypto");
};
js.Node.get_dgram = function() {
	return js.Node.require("dgram");
};
js.Node.get_dns = function() {
	return js.Node.require("dns");
};
js.Node.get_fs = function() {
	return js.Node.require("fs");
};
js.Node.get_http = function() {
	return js.Node.require("http");
};
js.Node.get_https = function() {
	return js.Node.require("https");
};
js.Node.get_net = function() {
	return js.Node.require("net");
};
js.Node.get_os = function() {
	return js.Node.require("os");
};
js.Node.get_path = function() {
	return js.Node.require("path");
};
js.Node.get_querystring = function() {
	return js.Node.require("querystring");
};
js.Node.get_repl = function() {
	return js.Node.require("repl");
};
js.Node.get_tls = function() {
	return js.Node.require("tls");
};
js.Node.get_url = function() {
	return js.Node.require("url");
};
js.Node.get_util = function() {
	return js.Node.require("util");
};
js.Node.get_vm = function() {
	return js.Node.require("vm");
};
js.Node.get_zlib = function() {
	return js.Node.require("zlib");
};
js.Node.get___filename = function() {
	return __filename;
};
js.Node.get___dirname = function() {
	return __dirname;
};
js.Node.get_json = function() {
	return JSON;
};
js.Node.newSocket = function(options) {
	return new js.Node.net.Socket(options);
};
js.Node.isNodeWebkit = function() {
	return (typeof process == "object");
};
var saturn = saturn || {};
if(!saturn.app) saturn.app = {};
saturn.app.SaturnServer = $hxClasses["saturn.app.SaturnServer"] = function() {
	this.usingEncryption = false;
	this.__dirname = __dirname;
	this.restify = js.Node.require("restify");
	this.osLib = js.Node.require("os");
	this.execLib = js.Node.require("child_process");
	this.domainLib = js.Node.require("domain");
	this.httpLib = js.Node.require("http");
	this.cryptoLib = js.Node.require("crypto");
	this.tempLib = js.Node.require("temp");
	this.pathLib = js.Node.require("path");
	this.fsExtraLib = js.Node.require("fs-extra");
	this.fsLib = js.Node.require("fs");
	this.serviceConfigs = new haxe.ds.StringMap();
	this.socketPlugins = [];
	this.plugins = [];
	if(js.Node.process.argv.length == 3) {
		this.servicesFile = js.Node.process.argv[2];
		this.loadServiceDefinition(function() {
		});
	} else {
		this.debug("Usage\tServices File\n");
		js.Node.process.exit(-1);
	}
};
saturn.app.SaturnServer.__name__ = ["saturn","app","SaturnServer"];
saturn.app.SaturnServer.main = function() {
	saturn.app.SaturnServer.defaultServer = new saturn.app.SaturnServer();
};
saturn.app.SaturnServer.getDefaultServer = function() {
	return saturn.app.SaturnServer.defaultServer;
};
saturn.app.SaturnServer.debuglog = function(name,value) {
	saturn.app.SaturnServer.DEBUG(name,value);
};
saturn.app.SaturnServer.getStandardUserInputError = function() {
	return "Invalid User Input";
};
saturn.app.SaturnServer.makeStaticAvailable = function(filePath,cb) {
	var outputPath = saturn.app.SaturnServer.getDefaultServer().getRelativePublicOuputFolder() + "/" + Std.string(saturn.app.SaturnServer.getDefaultServer().pathLib.basename(filePath)) + ".txt";
	var remotePath = saturn.app.SaturnServer.getDefaultServer().getRelativePublicOuputURL() + "/" + Std.string(saturn.app.SaturnServer.getDefaultServer().pathLib.basename(filePath)) + ".txt";
	bindings.NodeFSExtra.copy(filePath,outputPath,function(err) {
		cb(err,remotePath);
	});
};
saturn.app.SaturnServer.prototype = {
	fsLib: null
	,fsExtraLib: null
	,pathLib: null
	,tempLib: null
	,cryptoLib: null
	,httpLib: null
	,domainLib: null
	,execLib: null
	,osLib: null
	,restify: null
	,__dirname: null
	,server: null
	,theServerSocket: null
	,serviceConfigs: null
	,serviceConfig: null
	,servicesFile: null
	,localServerConfig: null
	,port: null
	,redisPort: null
	,socketPlugins: null
	,plugins: null
	,redisClient: null
	,internalConnectionHostName: null
	,authPlugin: null
	,usingEncryption: null
	,isEncrypted: function() {
		return this.usingEncryption;
	}
	,getInternalConnectionHostName: function() {
		return this.internalConnectionHostName;
	}
	,getRedisPort: function() {
		return this.redisPort;
	}
	,getPort: function() {
		return this.port;
	}
	,getHostname: function() {
		return this.getServerConfig().hostname;
	}
	,getServerConfig: function() {
		return this.localServerConfig;
	}
	,initialiseServer: function(index_page) {
		var _g = this;
		var http_config = { };
		var serverConfig = this.getServerConfig();
		if(Object.prototype.hasOwnProperty.call(serverConfig,"internalConnectionHostName")) this.internalConnectionHostName = Reflect.field(serverConfig,"internalConnectionHostName"); else this.internalConnectionHostName = Reflect.field(serverConfig,"hostname");
		if(Object.prototype.hasOwnProperty.call(serverConfig,"restify_http_options")) {
			http_config = Reflect.field(serverConfig,"restify_http_options");
			saturn.core.Util.debug(saturn.core.Util.string(http_config));
			if(Object.prototype.hasOwnProperty.call(http_config,"cert")) {
				var certificate = Reflect.field(http_config,"cert");
				if(certificate != null && certificate != "") {
					this.usingEncryption = true;
					this.server = this.restify.createServer({ 'httpsServerOptions' : http_config});
				}
			}
		} else this.server = this.restify.createServer();
		this.server["use"](this.restify.plugins.queryParser({ mapParams : true}));
		this.server["use"](this.restify.plugins.bodyParser({ mapParams : true}));
		var CookieParser = js.Node.require("restify-cookies");
		this.server["use"](CookieParser.parse);
		this.installPlugins();
		this.installSocketPlugins();
		this.server.get("/static/*",this.restify.plugins.serveStatic({ directory : "./public"}));
		this.server.get("/",function(req,res,next) {
			res.header("Location",index_page);
			res.send(302);
			return next(false);
		});
		this.configureRedisClient();
		if(saturn.app.SaturnServer.beforeListen != null) saturn.app.SaturnServer.beforeListen();
		this.server.listen(this.port,serverConfig.hostname,function() {
			_g.debug("Server listening at " + Std.string(_g.server.url));
		});
		if(saturn.app.SaturnServer.afterListen != null) saturn.app.SaturnServer.afterListen();
	}
	,installSocketPlugins: function() {
		var _g = this;
		if(Reflect.hasField(this.getServerConfig(),"socket_plugins")) {
			var pluginDefs = this.getServerConfig().socket_plugins;
			var _g1 = 0;
			while(_g1 < pluginDefs.length) {
				var pluginDef = pluginDefs[_g1];
				++_g1;
				this.debug("PLUGIN: " + Std.string(pluginDef.clazz));
				var plugin = Type.createInstance(Type.resolveClass(pluginDef.clazz),[this,pluginDef]);
				this.socketPlugins.push(plugin);
			}
			var Queue = js.Node.require("bull");
			this.theServerSocket.sockets.on("connection",function(socket) {
				var _g11 = 0;
				var _g2 = _g.socketPlugins;
				while(_g11 < _g2.length) {
					var plugin1 = _g2[_g11];
					++_g11;
					plugin1.addListeners(socket);
				}
			});
		}
	}
	,installPlugins: function() {
		if(Reflect.hasField(this.getServerConfig(),"plugins")) {
			var pluginDefs = this.getServerConfig().plugins;
			var _g = 0;
			while(_g < pluginDefs.length) {
				var pluginDef = pluginDefs[_g];
				++_g;
				this.debug("PLUGIN: " + Std.string(pluginDef.clazz));
				var plugin = Type.createInstance(Type.resolveClass(pluginDef.clazz),[this,pluginDef]);
				this.plugins.push(plugin);
			}
		}
	}
	,loadServiceDefinition: function(__return) {
		var _g = this;
		(function(__afterVar_0) {
			js.Node.require("fs").readFile(_g.servicesFile,"utf8",function(__parameter_1,__parameter_2) {
				__afterVar_0(__parameter_1,__parameter_2);
			});
		})(function(err,content) {
			err;
			content;
			if(err == null) {
				_g.serviceConfig = JSON.parse(content);
				if(Object.prototype.hasOwnProperty.call(_g.serviceConfig,"port")) {
					_g.port = _g.serviceConfig.port;
					if(Object.prototype.hasOwnProperty.call(_g.serviceConfig,"redis_port")) {
						_g.redisPort = _g.serviceConfig.redis_port;
						var value = _g.serviceConfig;
						_g.serviceConfigs.set("localhost: " + _g.port,value);
						_g.localServerConfig = _g.serviceConfig;
						_g.initialiseServer(_g.serviceConfig.index_page);
						__return();
					} else {
						_g.debug("Service config is missing redis_port property");
						js.Node.process.exit(-1);
						__return();
					}
				} else {
					_g.debug("Service config is missing port property");
					js.Node.process.exit(-1);
					__return();
				}
			} else {
				_g.debug(err);
				js.Node.process.exit(-1);
				__return();
			}
		});
	}
	,debug: function(msg) {
		saturn.app.SaturnServer.DEBUG(msg);
	}
	,getStandardErrorCode: function() {
		return "H2IK";
	}
	,getRelativePublicStorageFolder: function() {
		return "public/static";
	}
	,getRelativePublicStorageURL: function() {
		return "static";
	}
	,getRelativePublicOuputFolder: function() {
		return this.getRelativePublicStorageFolder() + "/out";
	}
	,getRelativePublicOuputURL: function() {
		return this.getRelativePublicStorageURL() + "/out";
	}
	,getPythonPath: function() {
		if(js.Node.require("os").platform() == "win32") return "C:/python27/Python.exe"; else return "/opt/python/python_builds/python-2.7.7/bin/python";
	}
	,getServer: function() {
		return this.server;
	}
	,getServerSocket: function() {
		return this.theServerSocket;
	}
	,setServerSocket: function(socket) {
		this.theServerSocket = socket;
	}
	,installLogin: function() {
	}
	,getSocketUser: function(socket,cb) {
		this.isSocketAuthenticated(socket,cb);
	}
	,setUser: function(socket,user) {
		socket.decoded_token = user;
	}
	,isSocketAuthenticated: function(socket,cb) {
		if(socket.decoded_token) {
			var user = this.getSocketUserNoAuthCheck(socket);
			this.isUserAuthenticated(user,cb);
		} else cb(null);
	}
	,getSocketUserNoAuthCheck: function(socket) {
		return socket.decoded_token;
	}
	,isUserAuthenticated: function(user,cb) {
		this.getAuthenticationPlugin().isUserAuthenticated(user,cb);
	}
	,configureRedisClient: function() {
		var _g = this;
		var redis = js.Node.require("redis");
		this.redisClient = redis.createClient(this.getRedisPort(),this.getHostname());
		this.redisClient.on("error",function(err) {
			_g.debug("Redis Error " + err);
			js.Node.process.exit(-1);
		});
	}
	,getRedisClient: function() {
		return this.redisClient;
	}
	,setAuthenticationPlugin: function(authPlugin) {
		this.authPlugin = authPlugin;
	}
	,getAuthenticationPlugin: function() {
		return this.authPlugin;
	}
	,__class__: saturn.app.SaturnServer
};
if(!saturn.client) saturn.client = {};
if(!saturn.client.core) saturn.client.core = {};
saturn.client.core.CommonCore = $hxClasses["saturn.client.core.CommonCore"] = function() { };
saturn.client.core.CommonCore.__name__ = ["saturn","client","core","CommonCore"];
saturn.client.core.CommonCore.setDefaultProvider = function(provider,name,defaultProvider) {
	if(name == null) name = "DEFAULT";
	saturn.client.core.CommonCore.providers.set(name,provider);
	if(defaultProvider) saturn.client.core.CommonCore.DEFAULT_POOL_NAME = name;
};
saturn.client.core.CommonCore.closeProviders = function() {
	var $it0 = saturn.client.core.CommonCore.providers.keys();
	while( $it0.hasNext() ) {
		var name = $it0.next();
		saturn.client.core.CommonCore.providers.get(name)._closeConnection();
	}
};
saturn.client.core.CommonCore.getStringError = function(error) {
	var dwin = window;
	dwin.error = error;
	return error;
};
saturn.client.core.CommonCore.getCombinedModels = function() {
	if(saturn.client.core.CommonCore.combinedModels == null) {
		saturn.client.core.CommonCore.combinedModels = new haxe.ds.StringMap();
		var _g = 0;
		var _g1 = saturn.client.core.CommonCore.getProviderNames();
		while(_g < _g1.length) {
			var name = _g1[_g];
			++_g;
			var models = saturn.client.core.CommonCore.getDefaultProvider(null,name).getModels();
			var $it0 = models.keys();
			while( $it0.hasNext() ) {
				var key = $it0.next();
				var value;
				value = __map_reserved[key] != null?models.getReserved(key):models.h[key];
				saturn.client.core.CommonCore.combinedModels.set(key,value);
			}
		}
	}
	return saturn.client.core.CommonCore.combinedModels;
};
saturn.client.core.CommonCore.getProviderNameForModel = function(name) {
	var models = saturn.client.core.CommonCore.getCombinedModels();
	if(__map_reserved[name] != null?models.existsReserved(name):models.h.hasOwnProperty(name)) {
		if((__map_reserved[name] != null?models.getReserved(name):models.h[name]).exists("provider_name")) return (__map_reserved[name] != null?models.getReserved(name):models.h[name]).get("provider_name"); else return null;
	} else return null;
};
saturn.client.core.CommonCore.getProviderForNamedQuery = function(name) {
	var $it0 = saturn.client.core.CommonCore.providers.keys();
	while( $it0.hasNext() ) {
		var providerName = $it0.next();
		var provider = saturn.client.core.CommonCore.providers.get(providerName);
		var config = provider.getConfig();
		if(Object.prototype.hasOwnProperty.call(config,"named_queries")) {
			if(Reflect.hasField(Reflect.field(config,"named_queries"),name)) return providerName;
		}
	}
	return null;
};
saturn.client.core.CommonCore.getDefaultProvider = function(cb,name) {
	if(name == null) name = saturn.client.core.CommonCore.getDefaultProviderName();
	if(saturn.client.core.CommonCore.providers.exists(name)) {
		if(cb != null) cb(null,saturn.client.core.CommonCore.providers.get(name));
		return saturn.client.core.CommonCore.providers.get(name);
	} else if(name != null) {
		saturn.client.core.CommonCore.getResource(name,cb);
		return -1;
	}
	return null;
};
saturn.client.core.CommonCore.getProviderNames = function() {
	var names = [];
	var $it0 = saturn.client.core.CommonCore.providers.keys();
	while( $it0.hasNext() ) {
		var name = $it0.next();
		names.push(name);
	}
	var $it1 = saturn.client.core.CommonCore.pools.keys();
	while( $it1.hasNext() ) {
		var name1 = $it1.next();
		names.push(name1);
	}
	return names;
};
saturn.client.core.CommonCore.getFileExtension = function(fileName) {
	var r = new EReg("\\.(\\w+)","");
	r.match(fileName);
	return r.matched(1);
};
saturn.client.core.CommonCore.getBinaryFileAsArrayBuffer = function(file) {
	var fileReader = new FileReader();
	return fileReader.readAsArrayBuffer(file);
};
saturn.client.core.CommonCore.convertArrayBufferToBase64 = function(buffer) {
	var binary = "";
	var bytes = new Uint8Array(buffer);
	var len = bytes.byteLength;
	var _g = 0;
	while(_g < len) {
		var i = _g++;
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
};
saturn.client.core.CommonCore.getFileAsText = function(file,cb) {
	if(js.Boot.__instanceof(file,saturn.core.FileShim)) cb(file.getAsText()); else if(Object.prototype.hasOwnProperty.call(file,"_data")) cb(file.asText()); else {
		var fileReader = new FileReader();
		fileReader.onload = function(e) {
			cb(e.target.result);
		};
		fileReader.readAsText(file);
	}
};
saturn.client.core.CommonCore.getFileInChunks = function(file,chunkSize,cb) {
	var offset = 0;
	var fileSize = file.size;
	var chunker = null;
	chunker = function() {
		var reader = new FileReader();
		reader.readAsDataURL(file.slice(offset,offset + chunkSize));
		reader.onloadend = function(event) {
			if(event.target.error == null) cb(null,reader.result.split(",")[1],function() {
				offset += chunkSize;
				if(offset >= fileSize) cb(null,null,null); else chunker();
			}); else cb(event.target.error,null,null);
		};
	};
	chunker();
};
saturn.client.core.CommonCore.getFileAsArrayBuffer = function(file,cb) {
	if(js.Boot.__instanceof(file,saturn.core.FileShim)) cb(file.getAsArrayBuffer()); else if(Object.prototype.hasOwnProperty.call(file,"_data")) cb(file.asUint8Array()); else {
		var fileReader = new FileReader();
		fileReader.onload = function(e) {
			cb(e.target.result);
		};
		fileReader.readAsArrayBuffer(file);
	}
};
saturn.client.core.CommonCore.setPool = function(poolName,pool,isDefault) {
	if(poolName == null) poolName = "DEFAULT";
	saturn.client.core.CommonCore.pools.set(poolName,pool);
	if(isDefault) saturn.client.core.CommonCore.DEFAULT_POOL_NAME = poolName;
};
saturn.client.core.CommonCore.getPool = function(poolName) {
	if(poolName == null) poolName = "DEFAULT";
	if(saturn.client.core.CommonCore.pools.exists(poolName)) return saturn.client.core.CommonCore.pools.get(poolName); else return null;
};
saturn.client.core.CommonCore.getResource = function(poolName,cb) {
	if(poolName == null) poolName = "DEFAULT";
	var pool = saturn.client.core.CommonCore.getPool(poolName);
	if(pool != null) pool.acquire(function(err,resource) {
		if(err == null) saturn.client.core.CommonCore.resourceToPool.set(resource,poolName);
		cb(err,resource);
	}); else cb("Invalid pool name",null);
};
saturn.client.core.CommonCore.releaseResource = function(resource) {
	if(saturn.client.core.CommonCore.resourceToPool.exists(resource)) {
		var poolName = saturn.client.core.CommonCore.resourceToPool.get(resource);
		if(saturn.client.core.CommonCore.pools.exists(poolName)) {
			var pool = saturn.client.core.CommonCore.pools.get(poolName);
			pool.release(resource);
			return -3;
		} else return -2;
	} else return -1;
};
saturn.client.core.CommonCore.makeFullyQualified = function(path) {
	var location = window.location;
	return location.protocol + "//" + location.hostname + ":" + location.port + "/" + path;
};
saturn.client.core.CommonCore.getContent = function(url,onSuccess,onFailure) {
	Ext.Ajax.request({ url : url, success : function(response,opts) {
		onSuccess(response.responseText);
	}, failure : function(response1,opts1) {
		onFailure(response1);
	}});
};
saturn.client.core.CommonCore.getDefaultProviderName = function() {
	return saturn.client.core.CommonCore.DEFAULT_POOL_NAME;
};
if(!saturn.core) saturn.core = {};
saturn.core.CutProductDirection = $hxClasses["saturn.core.CutProductDirection"] = { __ename__ : ["saturn","core","CutProductDirection"], __constructs__ : ["UPSTREAM","DOWNSTREAM","UPDOWN"] };
saturn.core.CutProductDirection.UPSTREAM = ["UPSTREAM",0];
saturn.core.CutProductDirection.UPSTREAM.toString = $estr;
saturn.core.CutProductDirection.UPSTREAM.__enum__ = saturn.core.CutProductDirection;
saturn.core.CutProductDirection.DOWNSTREAM = ["DOWNSTREAM",1];
saturn.core.CutProductDirection.DOWNSTREAM.toString = $estr;
saturn.core.CutProductDirection.DOWNSTREAM.__enum__ = saturn.core.CutProductDirection;
saturn.core.CutProductDirection.UPDOWN = ["UPDOWN",2];
saturn.core.CutProductDirection.UPDOWN.toString = $estr;
saturn.core.CutProductDirection.UPDOWN.__enum__ = saturn.core.CutProductDirection;
if(!saturn.core.molecule) saturn.core.molecule = {};
saturn.core.molecule.Molecule = $hxClasses["saturn.core.molecule.Molecule"] = function(seq) {
	this.linked = false;
	this.allowStar = false;
	this.floatAttributes = new haxe.ds.StringMap();
	this.stringAttributes = new haxe.ds.StringMap();
	this.annotations = new haxe.ds.StringMap();
	this.rawAnnotationData = new haxe.ds.StringMap();
	this.annotationCRC = new haxe.ds.StringMap();
	this.setSequence(seq);
};
saturn.core.molecule.Molecule.__name__ = ["saturn","core","molecule","Molecule"];
saturn.core.molecule.Molecule.prototype = {
	sequence: null
	,starPosition: null
	,originalSequence: null
	,linkedOriginField: null
	,sequenceField: null
	,floatAttributes: null
	,stringAttributes: null
	,name: null
	,alternativeName: null
	,annotations: null
	,rawAnnotationData: null
	,annotationCRC: null
	,crc: null
	,allowStar: null
	,parent: null
	,linked: null
	,getValue: function() {
		return this.getSequence();
	}
	,isLinked: function() {
		return this.linked;
	}
	,setParent: function(parent) {
		this.parent = parent;
	}
	,getParent: function() {
		return this.parent;
	}
	,isChild: function() {
		return this.parent != null;
	}
	,setCRC: function(crc) {
		this.crc = crc;
	}
	,updateCRC: function() {
		if(this.sequence != null) this.crc = haxe.crypto.Md5.encode(this.sequence);
	}
	,getAnnotationCRC: function(annotationName) {
		return this.annotationCRC.get(annotationName);
	}
	,getCRC: function() {
		return this.crc;
	}
	,setRawAnnotationData: function(rawAnnotationData,annotationName) {
		var value = rawAnnotationData;
		this.rawAnnotationData.set(annotationName,value);
	}
	,getRawAnnotationData: function(annotationName) {
		return this.rawAnnotationData.get(annotationName);
	}
	,setAllAnnotations: function(annotations) {
		this.removeAllAnnotations();
		var $it0 = annotations.keys();
		while( $it0.hasNext() ) {
			var annotationName = $it0.next();
			this.setAnnotations(__map_reserved[annotationName] != null?annotations.getReserved(annotationName):annotations.h[annotationName],annotationName);
		}
	}
	,removeAllAnnotations: function() {
		var $it0 = this.annotations.keys();
		while( $it0.hasNext() ) {
			var annotationName = $it0.next();
			this.annotations.remove(annotationName);
			this.annotationCRC.remove(annotationName);
		}
	}
	,setAnnotations: function(annotations,annotationName) {
		this.annotations.set(annotationName,annotations);
		var value = this.getCRC();
		this.annotationCRC.set(annotationName,value);
	}
	,getAnnotations: function(name) {
		return this.annotations.get(name);
	}
	,getAllAnnotations: function() {
		return this.annotations;
	}
	,getAlternativeName: function() {
		return this.alternativeName;
	}
	,setAlternativeName: function(altName) {
		this.alternativeName = altName;
	}
	,getMoleculeName: function() {
		return this.name;
	}
	,setMoleculeName: function(name) {
		this.name = name;
	}
	,getName: function() {
		return this.getMoleculeName();
	}
	,setName: function(name) {
		this.setMoleculeName(name);
	}
	,getSequence: function() {
		return this.sequence;
	}
	,setSequence: function(seq) {
		if(seq != null) {
			seq = seq.toUpperCase();
			seq = saturn.core.molecule.Molecule.whiteSpaceReg.replace(seq,"");
			seq = saturn.core.molecule.Molecule.newLineReg.replace(seq,"");
			seq = saturn.core.molecule.Molecule.carLineReg.replace(seq,"");
			this.starPosition = seq.indexOf("*");
			if(!this.allowStar) {
				this.originalSequence = seq;
				seq = saturn.core.molecule.Molecule.reg_starReplace.replace(seq,"");
			}
			this.sequence = seq;
		}
		this.updateCRC();
	}
	,getFirstPosition: function(seq) {
		return this.sequence.indexOf(seq);
	}
	,getLastPosition: function(seq) {
		if(seq == "") return -1;
		var c = 0;
		var lastMatchPos = -1;
		var lastLastMatchPos = -1;
		while(true) {
			lastMatchPos = this.sequence.indexOf(seq,lastMatchPos + 1);
			if(lastMatchPos != -1) {
				lastLastMatchPos = lastMatchPos;
				c++;
			} else break;
		}
		return lastLastMatchPos;
	}
	,getLocusCount: function(seq) {
		if(seq == "") return 0;
		var c = 0;
		var lastMatchPos = -1;
		while(true) {
			lastMatchPos = this.sequence.indexOf(seq,lastMatchPos + 1);
			if(lastMatchPos != -1) c++; else break;
		}
		return c;
	}
	,contains: function(seq) {
		if(this.sequence.indexOf(seq) > -1) return true; else return false;
	}
	,getLength: function() {
		return this.sequence.length;
	}
	,getStarPosition: function() {
		return this.starPosition;
	}
	,setStarPosition: function(starPosition) {
		this.starPosition = starPosition;
	}
	,getStarSequence: function() {
		return this.originalSequence;
	}
	,equals: function(other) {
		if(other.getStarPosition() != this.getStarPosition()) return false; else if(this.getSequence() != other.getSequence()) return false;
		return true;
	}
	,getCutPosition: function(template) {
		if(template.getLocusCount(this.getSequence()) > 0) {
			var siteStartPosition = template.getFirstPosition(this.getSequence());
			return siteStartPosition + this.starPosition;
		} else return -1;
	}
	,getAfterCutSequence: function(template) {
		var cutPosition = this.getCutPosition(template);
		if(cutPosition == -1) return ""; else {
			var seq = template.getSequence();
			return seq.substring(cutPosition,seq.length);
		}
	}
	,getBeforeCutSequence: function(template) {
		var cutPosition = this.getCutPosition(template);
		if(cutPosition == -1) return ""; else {
			var seq = template.getSequence();
			return seq.substring(0,cutPosition);
		}
	}
	,getLastCutPosition: function(template) {
		if(template.getLocusCount(this.getSequence()) > 0) {
			var siteStartPosition = template.getLastPosition(this.getSequence());
			return siteStartPosition + this.starPosition;
		} else return -1;
	}
	,getLastBeforeCutSequence: function(template) {
		var cutPosition = this.getLastCutPosition(template);
		if(cutPosition == -1) return ""; else {
			var seq = template.getSequence();
			return seq.substring(0,cutPosition);
		}
	}
	,getLastAfterCutSequence: function(template) {
		var cutPosition = this.getLastCutPosition(template);
		if(cutPosition == -1) return ""; else {
			var seq = template.getSequence();
			return seq.substring(cutPosition,seq.length);
		}
	}
	,getCutProduct: function(template,direction) {
		if(direction == saturn.core.CutProductDirection.UPSTREAM) return this.getBeforeCutSequence(template); else if(direction == saturn.core.CutProductDirection.DOWNSTREAM) return this.getAfterCutSequence(template); else if(direction == saturn.core.CutProductDirection.UPDOWN) {
			var startPos = this.getCutPosition(template);
			var endPos = this.getLastCutPosition(template) - this.getLength();
			return template.getSequence().substring(startPos,endPos);
		} else return null;
	}
	,getFloatAttribute: function(attr) {
		return this._getFloatAttribute(Std.string(attr));
	}
	,_getFloatAttribute: function(attributeName) {
		if(this.floatAttributes.exists(attributeName)) return this.floatAttributes.get(attributeName);
		return null;
	}
	,setValue: function(value) {
		this.setSequence(value);
	}
	,_setFloatAttribute: function(attributeName,val) {
		this.floatAttributes.set(attributeName,val);
	}
	,setFloatAttribute: function(attr,val) {
		this._setFloatAttribute(Std.string(attr),val);
	}
	,getStringAttribute: function(attr) {
		return this._getStringAttribute(Std.string(attr));
	}
	,_getStringAttribute: function(attributeName) {
		if(this.stringAttributes.exists(attributeName)) return this.stringAttributes.get(attributeName);
		return null;
	}
	,_setStringAttribute: function(attributeName,val) {
		this.stringAttributes.set(attributeName,val);
	}
	,setStringAttribute: function(attr,val) {
		this._setStringAttribute(Std.string(attr),val);
		return;
	}
	,getMW: function() {
		return this.getFloatAttribute(saturn.core.molecule.MoleculeFloatAttribute.MW);
	}
	,findMatchingLocuses: function(locus,mode) {
		var collookup_single = new EReg("^(\\d+)$","");
		if(collookup_single.match(locus)) {
			var num = collookup_single.matched(1);
			var locusPosition = new saturn.core.LocusPosition();
			locusPosition.start = Std.parseInt(num) - 1;
			locusPosition.end = locusPosition.start;
			return [locusPosition];
		}
		var collookup_double = new EReg("^(\\d+)-(\\d+)$","");
		if(collookup_double.match(locus)) {
			var locusPosition1 = new saturn.core.LocusPosition();
			locusPosition1.start = Std.parseInt(collookup_double.matched(1)) - 1;
			locusPosition1.end = Std.parseInt(collookup_double.matched(2)) - 1;
			return [locusPosition1];
		}
		var collookup_toend = new EReg("^(\\d+)-$","");
		if(collookup_toend.match(locus)) {
			var locusPosition2 = new saturn.core.LocusPosition();
			locusPosition2.start = Std.parseInt(collookup_toend.matched(1)) - 1;
			locusPosition2.end = this.getLength() - 1;
			return [locusPosition2];
		}
		var re_missMatchTotal = new EReg("^(\\d+)(.+)","");
		if(mode == null) {
			mode = saturn.core.molecule.MoleculeAlignMode.REGEX;
			if(re_missMatchTotal.match(locus)) mode = saturn.core.molecule.MoleculeAlignMode.SIMPLE;
		}
		if(mode == saturn.core.molecule.MoleculeAlignMode.REGEX) return this.findMatchingLocusesRegEx(locus); else if(mode == saturn.core.molecule.MoleculeAlignMode.SIMPLE) {
			var missMatchesAllowed = 0;
			if(re_missMatchTotal.match(locus)) {
				missMatchesAllowed = Std.parseInt(re_missMatchTotal.matched(1));
				locus = re_missMatchTotal.matched(2);
			}
			return this.findMatchingLocusesSimple(locus,missMatchesAllowed);
		} else return null;
	}
	,findMatchingLocusesSimple: function(locus,missMatchesAllowed) {
		if(missMatchesAllowed == null) missMatchesAllowed = 0;
		var positions = [];
		if(locus == null || locus == "") return positions;
		var currentMissMatches = 0;
		var seqI = -1;
		var lI = -1;
		var startPos = 0;
		var missMatchLimit = missMatchesAllowed + 1;
		var missMatchPositions = [];
		while(true) {
			lI++;
			seqI++;
			if(seqI > this.sequence.length - 1) break;
			if(locus.charAt(lI) != this.sequence.charAt(seqI)) {
				currentMissMatches++;
				missMatchPositions.push(seqI);
			}
			if(lI == 0) startPos = seqI;
			if(currentMissMatches == missMatchLimit) {
				seqI = startPos;
				lI = -1;
				currentMissMatches = 0;
				missMatchPositions = [];
			} else if(lI == locus.length - 1) {
				var locusPosition = new saturn.core.LocusPosition();
				locusPosition.start = startPos;
				locusPosition.end = seqI;
				locusPosition.missMatchPositions = missMatchPositions;
				positions.push(locusPosition);
				lI = -1;
				currentMissMatches = 0;
				missMatchPositions = [];
			}
		}
		return positions;
	}
	,findMatchingLocusesRegEx: function(regex) {
		var r = new EReg(regex,"i");
		var positions = [];
		if(regex == null || regex == "") return positions;
		var offSet = 0;
		var matchAgainst = this.sequence;
		while(matchAgainst != null) if(r.match(matchAgainst)) {
			var locusPosition = new saturn.core.LocusPosition();
			var match = r.matchedPos();
			locusPosition.start = match.pos + offSet;
			locusPosition.end = match.pos + match.len - 1 + offSet;
			offSet = locusPosition.end + 1;
			matchAgainst = r.matchedRight();
			positions.push(locusPosition);
		} else break;
		return positions;
	}
	,updateAnnotations: function(annotationName,config,annotationManager,cb) {
		if(this.getAnnotationCRC(annotationName) == this.getCRC()) cb(null,this.getAnnotations(annotationName)); else annotationManager.annotateMolecule(this,annotationName,config,function(err,res) {
			cb(err,res);
		});
	}
	,getAtPosition: function(pos) {
		return this.sequence.charAt(pos);
	}
	,__class__: saturn.core.molecule.Molecule
};
saturn.core.DNA = $hxClasses["saturn.core.DNA"] = function(seq) {
	this.reg_tReplace = new EReg("T","g");
	this.proteins = new haxe.ds.StringMap();
	saturn.core.molecule.Molecule.call(this,seq);
};
saturn.core.DNA.__name__ = ["saturn","core","DNA"];
saturn.core.DNA.isDNA = function(sequence) {
	var seqLen = sequence.length;
	var valid_nucs;
	var _g = new haxe.ds.StringMap();
	if(__map_reserved.A != null) _g.setReserved("A",true); else _g.h["A"] = true;
	if(__map_reserved.T != null) _g.setReserved("T",true); else _g.h["T"] = true;
	if(__map_reserved.G != null) _g.setReserved("G",true); else _g.h["G"] = true;
	if(__map_reserved.C != null) _g.setReserved("C",true); else _g.h["C"] = true;
	if(__map_reserved.U != null) _g.setReserved("U",true); else _g.h["U"] = true;
	valid_nucs = _g;
	var _g1 = 0;
	while(_g1 < seqLen) {
		var i = _g1++;
		var nuc = sequence.charAt(i).toUpperCase();
		if(!((__map_reserved[nuc] != null?valid_nucs.existsReserved(nuc):valid_nucs.h.hasOwnProperty(nuc)) && (__map_reserved[nuc] != null?valid_nucs.getReserved(nuc):valid_nucs.h[nuc]))) return false;
	}
	return true;
};
saturn.core.DNA.__super__ = saturn.core.molecule.Molecule;
saturn.core.DNA.prototype = $extend(saturn.core.molecule.Molecule.prototype,{
	protein: null
	,proteins: null
	,addProtein: function(name,protein) {
		if(protein != null) this.proteins.set(name,protein);
	}
	,removeProtein: function(name) {
		this.proteins.remove(name);
	}
	,getProtein: function(name) {
		return this.proteins.get(name);
	}
	,getProteinNames: function() {
		var names = [];
		var $it0 = this.proteins.keys();
		while( $it0.hasNext() ) {
			var name = $it0.next();
			names.push(name);
		}
		return names;
	}
	,getGCFraction: function() {
		var dnaComposition = this.getComposition();
		return (dnaComposition.cCount + dnaComposition.gCount) / this.getLength();
	}
	,reg_tReplace: null
	,convertToRNA: function() {
		return this.reg_tReplace.replace(this.getSequence(),"U");
	}
	,getHydrogenBondCount: function() {
		var dnaComposition = this.getComposition();
		return (dnaComposition.gCount + dnaComposition.cCount) * 3 + (dnaComposition.aCount + dnaComposition.tCount) * 2;
	}
	,getMolecularWeight: function(phosphateAt5Prime) {
		var dnaComposition = this.getComposition();
		var seqMW = 0.0;
		seqMW += dnaComposition.aCount * saturn.core.molecule.MoleculeConstants.aChainMW;
		seqMW += dnaComposition.tCount * saturn.core.molecule.MoleculeConstants.tChainMW;
		seqMW += dnaComposition.gCount * saturn.core.molecule.MoleculeConstants.gChainMW;
		seqMW += dnaComposition.cCount * saturn.core.molecule.MoleculeConstants.cChainMW;
		if(phosphateAt5Prime == false) seqMW -= saturn.core.molecule.MoleculeConstants.PO3;
		seqMW += saturn.core.molecule.MoleculeConstants.OH;
		return seqMW;
	}
	,setSequence: function(sequence) {
		saturn.core.molecule.Molecule.prototype.setSequence.call(this,sequence);
		if(this.isChild()) {
			var p = this.getParent();
			p.dnaSequenceUpdated(this.sequence);
		}
	}
	,proteinSequenceUpdated: function(sequence) {
	}
	,getComposition: function() {
		var aCount = 0;
		var tCount = 0;
		var gCount = 0;
		var cCount = 0;
		var seqLen = this.sequence.length;
		var _g = 0;
		while(_g < seqLen) {
			var i = _g++;
			var nuc = this.sequence.charAt(i);
			switch(nuc) {
			case "A":
				aCount++;
				break;
			case "T":
				tCount++;
				break;
			case "G":
				gCount++;
				break;
			case "C":
				cCount++;
				break;
			case "U":
				tCount++;
				break;
			}
		}
		return new saturn.core.DNAComposition(aCount,tCount,gCount,cCount);
	}
	,getMeltingTemperature: function() {
		var saltConc = 50;
		var primerConc = 500;
		var testTmCalc = new saturn.core.TmCalc();
		return testTmCalc.tmCalculation(this,saltConc,primerConc);
	}
	,findPrimer: function(startPos,minLength,maxLength,minMelting,maxMelting,extensionSequence,minLengthExtended,minMeltingExtended,maxMeltingExtentded) {
		if(maxMeltingExtentded == null) maxMeltingExtentded = -1;
		if(minMeltingExtended == null) minMeltingExtended = -1;
		if(minLengthExtended == null) minLengthExtended = -1;
		var cCount;
		var gCount;
		var tCount;
		var aCount = 0;
		var seq = HxOverrides.substr(this.sequence,startPos - 1,minLength - 1);
		var comp = new saturn.core.DNA(seq).getComposition();
		cCount = comp.cCount;
		gCount = comp.gCount;
		tCount = comp.tCount;
		aCount = comp.aCount;
		var rangeStart = startPos - 1 + minLength - 1;
		var rangeStop = rangeStart + maxLength;
		var _g = rangeStart;
		while(_g < rangeStop) {
			var i = _g++;
			var $char = this.sequence.charAt(i);
			if($char == "C") cCount++; else if($char == "G") gCount++; else if($char == "A") aCount++; else if($char == "T") tCount++;
			seq += $char;
			var mt = new saturn.core.DNA(seq).getMeltingTemperature();
			if(mt > maxMelting) throw new js._Boot.HaxeError(new saturn.util.HaxeException("Maximum melting temperature exceeded")); else if(mt >= minMelting && mt <= maxMelting) {
				if(extensionSequence == null) return seq; else {
					var completeSequence = new saturn.core.DNA(extensionSequence + seq);
					var completeMT = completeSequence.getMeltingTemperature();
					if(completeMT >= minMeltingExtended && completeMT <= maxMeltingExtentded && completeSequence.getLength() >= minLengthExtended) return seq; else if(completeMT < minMeltingExtended) continue; else if(completeMT > maxMeltingExtentded) throw new js._Boot.HaxeError(new saturn.util.HaxeException("Maximum melting temperature for extended primer sequence exceeded")); else if(completeSequence.getLength() < minLengthExtended) continue;
				}
			}
		}
		throw new js._Boot.HaxeError(new saturn.util.HaxeException("Unable to find region with required parameters"));
	}
	,getNumGC: function() {
		var seqLen = this.sequence.length;
		var gcNum = 0;
		var _g = 0;
		while(_g < seqLen) {
			var i = _g++;
			var nuc = this.sequence.charAt(i);
			if(nuc == "G" || nuc == "C") gcNum++;
		}
		return gcNum;
	}
	,getInverse: function() {
		var newSequence_b = "";
		var seqLen = this.sequence.length;
		var _g = 0;
		while(_g < seqLen) {
			var i = _g++;
			var j = seqLen - i - 1;
			var nuc = this.sequence.charAt(j);
			if(nuc == null) newSequence_b += "null"; else newSequence_b += "" + nuc;
		}
		return newSequence_b;
	}
	,getComplement: function() {
		var newSequence_b = "";
		var seqLen = this.sequence.length;
		var _g = 0;
		while(_g < seqLen) {
			var i = _g++;
			var nuc = this.sequence.charAt(i);
			switch(nuc) {
			case "A":
				nuc = "T";
				break;
			case "T":
				nuc = "A";
				break;
			case "G":
				nuc = "C";
				break;
			case "C":
				nuc = "G";
				break;
			}
			if(nuc == null) newSequence_b += "null"; else newSequence_b += "" + nuc;
		}
		return newSequence_b;
	}
	,getInverseComplement: function() {
		var newSequence_b = "";
		var seqLen = this.sequence.length;
		var _g = 0;
		while(_g < seqLen) {
			var i = _g++;
			var j = seqLen - i - 1;
			var nuc = this.sequence.charAt(j);
			switch(nuc) {
			case "A":
				nuc = "T";
				break;
			case "T":
				nuc = "A";
				break;
			case "G":
				nuc = "C";
				break;
			case "C":
				nuc = "G";
				break;
			}
			if(nuc == null) newSequence_b += "null"; else newSequence_b += "" + nuc;
		}
		return newSequence_b;
	}
	,getFirstStartCodonPosition: function(geneticCode) {
		var geneticCode1 = saturn.core.GeneticCodeRegistry.getRegistry().getGeneticCodeByEnum(geneticCode);
		var codons = geneticCode1.getStartCodons();
		var minStartPos = -1;
		var $it0 = codons.keys();
		while( $it0.hasNext() ) {
			var codon = $it0.next();
			var index = this.sequence.indexOf(codon);
			if(index > -1) {
				if(minStartPos == -1 || minStartPos > index) minStartPos = index;
			}
		}
		return minStartPos;
	}
	,getTranslation: function(geneticCode,offSetPosition,stopAtFirstStop) {
		if(offSetPosition == null) offSetPosition = 0;
		if(!this.canHaveCodons()) throw new js._Boot.HaxeError(new saturn.util.HaxeException("Unable to translate a sequence with less than 3 nucleotides"));
		var proteinSequenceBuffer_b = "";
		var seqLength = this.sequence.length;
		var finalCodonPosition = seqLength - (seqLength - offSetPosition) % 3;
		var geneticCode1 = saturn.core.GeneticCodeRegistry.getRegistry().getGeneticCodeByEnum(geneticCode);
		var startIndex = offSetPosition;
		var stopCodons = geneticCode1.getStopCodons();
		while(startIndex < finalCodonPosition) {
			var endIndex = startIndex + 3;
			var codon = this.sequence.substring(startIndex,endIndex);
			var code = geneticCode1.lookupCodon(codon);
			if(stopAtFirstStop && code == "!") break;
			if(code == null) proteinSequenceBuffer_b += "null"; else proteinSequenceBuffer_b += "" + code;
			startIndex = endIndex;
		}
		return proteinSequenceBuffer_b;
	}
	,getFrameTranslation: function(geneticCode,frame) {
		if(this.sequence == null) return null;
		var offSetPos = 0;
		if(frame == saturn.core.Frame.TWO) offSetPos = 1; else if(frame == saturn.core.Frame.THREE) offSetPos = 2;
		return this.getTranslation(geneticCode,offSetPos,true);
	}
	,getThreeFrameTranslation: function(geneticCode) {
		var threeFrameTranslations = new haxe.ds.StringMap();
		var value = this.getFrameTranslation(geneticCode,saturn.core.Frame.ONE);
		threeFrameTranslations.set(Std.string(saturn.core.Frame.ONE),value);
		var value1 = this.getFrameTranslation(geneticCode,saturn.core.Frame.TWO);
		threeFrameTranslations.set(Std.string(saturn.core.Frame.TWO),value1);
		var value2 = this.getFrameTranslation(geneticCode,saturn.core.Frame.THREE);
		threeFrameTranslations.set(Std.string(saturn.core.Frame.THREE),value2);
		return threeFrameTranslations;
	}
	,getSixFrameTranslation: function(geneticCode) {
		var forwardFrames = this.getThreeFrameTranslation(geneticCode);
		var dnaSeq = this.getInverseComplement();
		var inverseComplementDNAObj = new saturn.core.DNA(dnaSeq);
		var reverseFrames = inverseComplementDNAObj.getThreeFrameTranslation(geneticCode);
		var value;
		value = __map_reserved.ONE != null?reverseFrames.getReserved("ONE"):reverseFrames.h["ONE"];
		if(__map_reserved.ONE_IC != null) forwardFrames.setReserved("ONE_IC",value); else forwardFrames.h["ONE_IC"] = value;
		var value1;
		value1 = __map_reserved.TWO != null?reverseFrames.getReserved("TWO"):reverseFrames.h["TWO"];
		if(__map_reserved.TWO_IC != null) forwardFrames.setReserved("TWO_IC",value1); else forwardFrames.h["TWO_IC"] = value1;
		var value2;
		value2 = __map_reserved.THREE != null?reverseFrames.getReserved("THREE"):reverseFrames.h["THREE"];
		if(__map_reserved.THREE_IC != null) forwardFrames.setReserved("THREE_IC",value2); else forwardFrames.h["THREE_IC"] = value2;
		return forwardFrames;
	}
	,getFirstStartCodonPositionByFrame: function(geneticCode,frame) {
		var startCodons = this.getStartCodonPositions(geneticCode,frame,true);
		if(startCodons.length == 0) return -1; else return startCodons[0];
	}
	,getStartCodonPositions: function(geneticCode,frame,stopAtFirst) {
		var offSet = 0;
		if(frame == saturn.core.Frame.TWO) offSet = 1; else if(frame == saturn.core.Frame.THREE) offSet = 2;
		var seqLength = this.sequence.length;
		var startingIndex = offSet;
		if(seqLength < startingIndex + 3) throw new js._Boot.HaxeError(new saturn.util.HaxeException("Insufficient DNA length to find codon start position for frame " + Std.string(frame)));
		var startCodonPositions = [];
		var finalCodonPosition = seqLength - (seqLength - offSet) % 3;
		var geneticCode1 = saturn.core.GeneticCodeRegistry.getRegistry().getGeneticCodeByEnum(geneticCode);
		var startIndex = startingIndex;
		while(startIndex < finalCodonPosition) {
			var endIndex = startIndex + 3;
			var codon = this.sequence.substring(startIndex,endIndex);
			if(geneticCode1.isStartCodon(codon)) {
				startCodonPositions.push(startIndex);
				if(stopAtFirst) break;
			}
			startIndex = endIndex;
		}
		return startCodonPositions;
	}
	,getFirstStopCodonPosition: function(geneticCode,frame) {
		var startCodons = this.getStopCodonPositions(geneticCode,frame,true);
		if(startCodons.isEmpty()) return -1; else return startCodons.first();
	}
	,getStopCodonPositions: function(geneticCode,frame,stopAtFirst) {
		var offSet = 0;
		if(frame == saturn.core.Frame.TWO) offSet = 1; else if(frame == saturn.core.Frame.THREE) offSet = 2;
		var seqLength = this.sequence.length;
		var startingIndex = offSet;
		if(seqLength < startingIndex + 3) throw new js._Boot.HaxeError(new saturn.util.HaxeException("Insufficient DNA length to find codon start position for frame " + Std.string(frame)));
		var startCodonPositions = new List();
		var finalCodonPosition = seqLength - (seqLength - offSet) % 3;
		var geneticCode1 = saturn.core.GeneticCodeRegistry.getRegistry().getGeneticCodeByEnum(geneticCode);
		var startIndex = startingIndex;
		while(startIndex < finalCodonPosition) {
			var endIndex = startIndex + 3;
			var codon = this.sequence.substring(startIndex,endIndex);
			if(geneticCode1.isStopCodon(codon)) {
				startCodonPositions.add(startIndex);
				if(stopAtFirst) break;
			}
			startIndex = endIndex;
		}
		return startCodonPositions;
	}
	,canHaveCodons: function() {
		if(this.sequence.length >= 3) return true; else return false;
	}
	,getFrameRegion: function(frame,start,stop) {
		var dnaStart;
		var dnaStop;
		if(frame == saturn.core.Frame.ONE) {
			dnaStart = start * 3 - 2;
			dnaStop = stop * 3;
		} else if(frame == saturn.core.Frame.TWO) {
			dnaStart = start * 3 - 1;
			dnaStop = stop * 3 + 1;
		} else if(frame == saturn.core.Frame.THREE) {
			dnaStart = start * 3;
			dnaStop = stop * 3 + 2;
		} else return null;
		return this.sequence.substring(dnaStart - 1,dnaStop);
	}
	,mutateResidue: function(frame,geneticCode,pos,mutAA) {
		var nucPos = this.getCodonStartPosition(frame,pos);
		if(nucPos >= this.sequence.length) throw new js._Boot.HaxeError(new saturn.util.HaxeException("Sequence not long enough for requested frame and position"));
		var geneticCode1 = saturn.core.GeneticCodeRegistry.getRegistry().getGeneticCodeByEnum(geneticCode);
		var codon = geneticCode1.getFirstCodon(mutAA);
		return this.sequence.substring(0,nucPos - 1) + codon + this.sequence.substring(nucPos + 2,this.sequence.length);
	}
	,getCodonStartPosition: function(frame,start) {
		var dnaStart;
		if(frame == saturn.core.Frame.ONE) dnaStart = start * 3 - 2; else if(frame == saturn.core.Frame.TWO) dnaStart = start * 3 - 1; else if(frame == saturn.core.Frame.THREE) dnaStart = start * 3; else return null;
		return dnaStart;
	}
	,getCodonStopPosition: function(frame,stop) {
		var dnaStop;
		if(frame == saturn.core.Frame.ONE) dnaStop = stop * 3; else if(frame == saturn.core.Frame.TWO) dnaStop = stop * 3 + 1; else if(frame == saturn.core.Frame.THREE) dnaStop = stop * 3 + 2; else return null;
		return dnaStop;
	}
	,getRegion: function(start,stop) {
		return HxOverrides.substr(this.sequence,start - 1,stop - start + 1);
	}
	,getFrom: function(start,len) {
		return HxOverrides.substr(this.sequence,start - 1,len);
	}
	,findMatchingLocuses: function(regex,mode) {
		var direction = saturn.core.Direction.Forward;
		if(StringTools.startsWith(regex,"r")) {
			var templateIC = new saturn.core.DNA(this.getInverseComplement());
			var regexIC = regex.substring(1,regex.length);
			var positions = templateIC.findMatchingLocuses(regexIC,mode);
			var length = this.getLength();
			var _g = 0;
			while(_g < positions.length) {
				var position = positions[_g];
				++_g;
				var originalStart = position.start;
				position.start = length - 1 - position.end;
				position.end = length - 1 - originalStart;
				if(position.missMatchPositions != null) {
					var fPositions = [];
					var _g1 = 0;
					var _g2 = position.missMatchPositions;
					while(_g1 < _g2.length) {
						var position1 = _g2[_g1];
						++_g1;
						fPositions.push(length - 1 - position1);
					}
					position.missMatchPositions = fPositions;
				}
			}
			return positions;
		} else return saturn.core.molecule.Molecule.prototype.findMatchingLocuses.call(this,regex);
	}
	,__class__: saturn.core.DNA
});
saturn.core.Frame = $hxClasses["saturn.core.Frame"] = { __ename__ : ["saturn","core","Frame"], __constructs__ : ["ONE","TWO","THREE"] };
saturn.core.Frame.ONE = ["ONE",0];
saturn.core.Frame.ONE.toString = $estr;
saturn.core.Frame.ONE.__enum__ = saturn.core.Frame;
saturn.core.Frame.TWO = ["TWO",1];
saturn.core.Frame.TWO.toString = $estr;
saturn.core.Frame.TWO.__enum__ = saturn.core.Frame;
saturn.core.Frame.THREE = ["THREE",2];
saturn.core.Frame.THREE.toString = $estr;
saturn.core.Frame.THREE.__enum__ = saturn.core.Frame;
saturn.core.Frames = $hxClasses["saturn.core.Frames"] = function() { };
saturn.core.Frames.__name__ = ["saturn","core","Frames"];
saturn.core.Frames.toInt = function(frame) {
	switch(frame[1]) {
	case 0:
		return 0;
	case 1:
		return 1;
	case 2:
		return 2;
	}
};
saturn.core.Direction = $hxClasses["saturn.core.Direction"] = { __ename__ : ["saturn","core","Direction"], __constructs__ : ["Forward","Reverse"] };
saturn.core.Direction.Forward = ["Forward",0];
saturn.core.Direction.Forward.toString = $estr;
saturn.core.Direction.Forward.__enum__ = saturn.core.Direction;
saturn.core.Direction.Reverse = ["Reverse",1];
saturn.core.Direction.Reverse.toString = $estr;
saturn.core.Direction.Reverse.__enum__ = saturn.core.Direction;
saturn.core.DNAComposition = $hxClasses["saturn.core.DNAComposition"] = function(aCount,tCount,gCount,cCount) {
	this.aCount = aCount;
	this.tCount = tCount;
	this.gCount = gCount;
	this.cCount = cCount;
};
saturn.core.DNAComposition.__name__ = ["saturn","core","DNAComposition"];
saturn.core.DNAComposition.prototype = {
	aCount: null
	,tCount: null
	,gCount: null
	,cCount: null
	,__class__: saturn.core.DNAComposition
};
saturn.core.GeneticCode = $hxClasses["saturn.core.GeneticCode"] = function() {
	this.codonLookupTable = new haxe.ds.StringMap();
	this.aaToCodonTable = new haxe.ds.StringMap();
	this.startCodons = new haxe.ds.StringMap();
	this.stopCodons = new haxe.ds.StringMap();
	this.populateTable();
};
saturn.core.GeneticCode.__name__ = ["saturn","core","GeneticCode"];
saturn.core.GeneticCode.prototype = {
	codonLookupTable: null
	,aaToCodonTable: null
	,startCodons: null
	,stopCodons: null
	,isAA: function(aa) {
		return this.aaToCodonTable.exists(aa);
	}
	,addStartCodon: function(codon) {
		this.startCodons.set(codon,"1");
	}
	,isStartCodon: function(codon) {
		return this.startCodons.exists(codon);
	}
	,addStopCodon: function(codon) {
		this.stopCodons.set(codon,"1");
	}
	,isStopCodon: function(codon) {
		return this.stopCodons.exists(codon);
	}
	,getStopCodons: function() {
		return this.stopCodons;
	}
	,getCodonCount: function() {
		return Lambda.count(this.codonLookupTable);
	}
	,getStartCodons: function() {
		var clone = new haxe.ds.StringMap();
		var $it0 = this.startCodons.keys();
		while( $it0.hasNext() ) {
			var key = $it0.next();
			var value = this.startCodons.get(key);
			if(__map_reserved[key] != null) clone.setReserved(key,value); else clone.h[key] = value;
		}
		return clone;
	}
	,populateTable: function() {
	}
	,lookupCodon: function(codon) {
		if(this.codonLookupTable.exists(codon)) return this.codonLookupTable.get(codon); else return "?";
	}
	,getCodonLookupTable: function() {
		return this.codonLookupTable;
	}
	,getAAToCodonTable: function() {
		return this.aaToCodonTable;
	}
	,getFirstCodon: function(aa) {
		if(this.aaToCodonTable.exists(aa)) {
			var codons = this.aaToCodonTable.get(aa);
			return codons.first();
		} else return null;
	}
	,__class__: saturn.core.GeneticCode
};
saturn.core.StandardGeneticCode = $hxClasses["saturn.core.StandardGeneticCode"] = function() {
	saturn.core.GeneticCode.call(this);
	saturn.core.GeneticCode.prototype.addStartCodon.call(this,"ATG");
	saturn.core.GeneticCode.prototype.addStopCodon.call(this,"TAA");
	saturn.core.GeneticCode.prototype.addStopCodon.call(this,"TGA");
	saturn.core.GeneticCode.prototype.addStopCodon.call(this,"TAG");
};
saturn.core.StandardGeneticCode.__name__ = ["saturn","core","StandardGeneticCode"];
saturn.core.StandardGeneticCode.getDefaultInstance = function() {
	return saturn.core.StandardGeneticCode.instance;
};
saturn.core.StandardGeneticCode.__super__ = saturn.core.GeneticCode;
saturn.core.StandardGeneticCode.prototype = $extend(saturn.core.GeneticCode.prototype,{
	populateTable: function() {
		this.codonLookupTable.set("TTT","F");
		this.codonLookupTable.set("TTC","F");
		this.codonLookupTable.set("TTA","L");
		this.codonLookupTable.set("TTG","L");
		this.codonLookupTable.set("TCT","S");
		this.codonLookupTable.set("TCC","S");
		this.codonLookupTable.set("TCA","S");
		this.codonLookupTable.set("TCG","S");
		this.codonLookupTable.set("TAT","Y");
		this.codonLookupTable.set("TAC","Y");
		this.codonLookupTable.set("TAA","!");
		this.codonLookupTable.set("TAG","!");
		this.codonLookupTable.set("TGT","C");
		this.codonLookupTable.set("TGC","C");
		this.codonLookupTable.set("TGA","!");
		this.codonLookupTable.set("TGG","W");
		this.codonLookupTable.set("CTT","L");
		this.codonLookupTable.set("CTC","L");
		this.codonLookupTable.set("CTA","L");
		this.codonLookupTable.set("CTG","L");
		this.codonLookupTable.set("CCT","P");
		this.codonLookupTable.set("CCC","P");
		this.codonLookupTable.set("CCA","P");
		this.codonLookupTable.set("CCG","P");
		this.codonLookupTable.set("CAT","H");
		this.codonLookupTable.set("CAC","H");
		this.codonLookupTable.set("CAA","Q");
		this.codonLookupTable.set("CAG","Q");
		this.codonLookupTable.set("CGT","R");
		this.codonLookupTable.set("CGC","R");
		this.codonLookupTable.set("CGA","R");
		this.codonLookupTable.set("CGG","R");
		this.codonLookupTable.set("ATT","I");
		this.codonLookupTable.set("ATC","I");
		this.codonLookupTable.set("ATA","I");
		this.codonLookupTable.set("ATG","M");
		this.codonLookupTable.set("ACT","T");
		this.codonLookupTable.set("ACC","T");
		this.codonLookupTable.set("ACA","T");
		this.codonLookupTable.set("ACG","T");
		this.codonLookupTable.set("AAT","N");
		this.codonLookupTable.set("AAC","N");
		this.codonLookupTable.set("AAA","K");
		this.codonLookupTable.set("AAG","K");
		this.codonLookupTable.set("AGT","S");
		this.codonLookupTable.set("AGC","S");
		this.codonLookupTable.set("AGA","R");
		this.codonLookupTable.set("AGG","R");
		this.codonLookupTable.set("GTT","V");
		this.codonLookupTable.set("GTC","V");
		this.codonLookupTable.set("GTA","V");
		this.codonLookupTable.set("GTG","V");
		this.codonLookupTable.set("GCT","A");
		this.codonLookupTable.set("GCC","A");
		this.codonLookupTable.set("GCA","A");
		this.codonLookupTable.set("GCG","A");
		this.codonLookupTable.set("GAT","D");
		this.codonLookupTable.set("GAC","D");
		this.codonLookupTable.set("GAA","E");
		this.codonLookupTable.set("GAG","E");
		this.codonLookupTable.set("GGT","G");
		this.codonLookupTable.set("GGC","G");
		this.codonLookupTable.set("GGA","G");
		this.codonLookupTable.set("GGG","G");
		var $it0 = this.codonLookupTable.keys();
		while( $it0.hasNext() ) {
			var key = $it0.next();
			var aa = this.codonLookupTable.get(key);
			if(!this.aaToCodonTable.exists(aa)) {
				var value = new List();
				this.aaToCodonTable.set(aa,value);
			}
			this.aaToCodonTable.get(aa).add(key);
		}
	}
	,__class__: saturn.core.StandardGeneticCode
});
saturn.core.GeneticCodes = $hxClasses["saturn.core.GeneticCodes"] = { __ename__ : ["saturn","core","GeneticCodes"], __constructs__ : ["STANDARD"] };
saturn.core.GeneticCodes.STANDARD = ["STANDARD",0];
saturn.core.GeneticCodes.STANDARD.toString = $estr;
saturn.core.GeneticCodes.STANDARD.__enum__ = saturn.core.GeneticCodes;
saturn.core.GeneticCodeRegistry = $hxClasses["saturn.core.GeneticCodeRegistry"] = function() {
	this.shortNameToCodeObj = new haxe.ds.StringMap();
	var value = saturn.core.StandardGeneticCode.getDefaultInstance();
	this.shortNameToCodeObj.set(Std.string(saturn.core.GeneticCodes.STANDARD),value);
};
saturn.core.GeneticCodeRegistry.__name__ = ["saturn","core","GeneticCodeRegistry"];
saturn.core.GeneticCodeRegistry.getRegistry = function() {
	return saturn.core.GeneticCodeRegistry.CODE_REGISTRY;
};
saturn.core.GeneticCodeRegistry.getDefault = function() {
	return saturn.core.GeneticCodeRegistry.getRegistry().getGeneticCodeByEnum(saturn.core.GeneticCodes.STANDARD);
};
saturn.core.GeneticCodeRegistry.prototype = {
	shortNameToCodeObj: null
	,getGeneticCodeNames: function() {
		var nameList = new List();
		var $it0 = this.shortNameToCodeObj.keys();
		while( $it0.hasNext() ) {
			var key = $it0.next();
			nameList.add(key);
		}
		return nameList;
	}
	,getGeneticCodeByName: function(shortName) {
		if(!this.shortNameToCodeObj.exists(shortName)) throw new js._Boot.HaxeError(new saturn.core.InvalidGeneticCodeException(shortName + " doesn't correspond to a genetic code in the main registry.")); else return this.shortNameToCodeObj.get(shortName);
	}
	,getGeneticCodeByEnum: function(code) {
		return this.getGeneticCodeByName(Std.string(code));
	}
	,__class__: saturn.core.GeneticCodeRegistry
};
if(!saturn.util) saturn.util = {};
saturn.util.HaxeException = $hxClasses["saturn.util.HaxeException"] = function(message) {
	this.errorMessage = message;
};
saturn.util.HaxeException.__name__ = ["saturn","util","HaxeException"];
saturn.util.HaxeException.prototype = {
	errorMessage: null
	,getMessage: function() {
		return this.errorMessage;
	}
	,toString: function() {
		return this.errorMessage;
	}
	,__class__: saturn.util.HaxeException
};
saturn.core.InvalidGeneticCodeException = $hxClasses["saturn.core.InvalidGeneticCodeException"] = function(message) {
	saturn.util.HaxeException.call(this,message);
};
saturn.core.InvalidGeneticCodeException.__name__ = ["saturn","core","InvalidGeneticCodeException"];
saturn.core.InvalidGeneticCodeException.__super__ = saturn.util.HaxeException;
saturn.core.InvalidGeneticCodeException.prototype = $extend(saturn.util.HaxeException.prototype,{
	__class__: saturn.core.InvalidGeneticCodeException
});
saturn.core.InvalidCodonException = $hxClasses["saturn.core.InvalidCodonException"] = function(message) {
	saturn.util.HaxeException.call(this,message);
};
saturn.core.InvalidCodonException.__name__ = ["saturn","core","InvalidCodonException"];
saturn.core.InvalidCodonException.__super__ = saturn.util.HaxeException;
saturn.core.InvalidCodonException.prototype = $extend(saturn.util.HaxeException.prototype,{
	__class__: saturn.core.InvalidCodonException
});
saturn.core.EUtils = $hxClasses["saturn.core.EUtils"] = function() {
};
saturn.core.EUtils.__name__ = ["saturn","core","EUtils"];
saturn.core.EUtils.getProteinsForGene = function(geneId,cb) {
	saturn.core.EUtils.getProteinGIsForGene(geneId,function(err,ids) {
		if(err != null) cb(err,null); else saturn.core.EUtils.getProteinInfo(ids,true,function(err1,objs) {
			cb(err1,objs);
		});
	});
};
saturn.core.EUtils.getProteinInfo = function(ids,lookupDNA,cb) {
	if(lookupDNA == null) lookupDNA = false;
	var c1 = saturn.core.EUtils.eutils.efetch({ db : "protein", id : ids, retmode : "xml"}).then(function(d) {
		if(!Object.prototype.hasOwnProperty.call(d,"GBSet")) {
			cb("Unable to retrieve proteins for  " + ids.toString(),null);
			return;
		}
		var objs;
		if((d.GBSet.GBSeq instanceof Array) && d.GBSet.GBSeq.__enum__ == null) objs = d.GBSet.GBSeq; else objs = [d.GBSet.GBSeq];
		if(objs == null || objs.length == 0) {
			cb("Unable to retrieve proteins for  " + ids.join(","),null);
			return;
		}
		var protObjs = [];
		var _g = 0;
		while(_g < objs.length) {
			var seqObj = objs[_g];
			++_g;
			var protein = new saturn.core.Protein(seqObj.GBSeq_sequence);
			protObjs.push(protein);
			protein.setMoleculeName(Reflect.field(seqObj,"GBSeq_accession-version"));
			if(Object.prototype.hasOwnProperty.call(seqObj,"GBSeq_other-seqids")) {
				var seqIdElems = Reflect.field(Reflect.field(seqObj,"GBSeq_other-seqids"),"GBSeqid");
				var _g1 = 0;
				while(_g1 < seqIdElems.length) {
					var seqIdElem = seqIdElems[_g1];
					++_g1;
					var seqId = seqIdElem;
					if(seqId.indexOf("gi|") == 0) {
						protein.setAlternativeName(seqId);
						break;
					}
				}
			}
			if(Object.prototype.hasOwnProperty.call(seqObj,"GBSeq_feature-table")) {
				var table = Reflect.field(seqObj,"GBSeq_feature-table");
				var features = table.GBFeature;
				var _g11 = 0;
				while(_g11 < features.length) {
					var feature = features[_g11];
					++_g11;
					if(feature.GBFeature_key == "CDS") {
						var feature_quals = feature.GBFeature_quals.GBQualifier;
						var _g2 = 0;
						while(_g2 < feature_quals.length) {
							var feature1 = feature_quals[_g2];
							++_g2;
							if(feature1.GBQualifier_name == "coded_by") {
								var acStr = feature1.GBQualifier_value;
								var parts = acStr.split(":");
								if(parts.length > 2) {
									cb("Parts greater than two for  " + protein.getMoleculeName(),null);
									return;
								} else {
									var dna = new saturn.core.DNA(null);
									var name = parts[0];
									dna.setMoleculeName(name);
									dna.addProtein("default",protein);
									protein.setReferenceCoordinates(parts[1]);
								}
							}
						}
					}
				}
			}
		}
		if(lookupDNA) {
			var dnaRefs = [];
			var _g3 = 0;
			while(_g3 < protObjs.length) {
				var protObj = protObjs[_g3];
				++_g3;
				dnaRefs.push(protObj.getDNA().getMoleculeName());
			}
			saturn.core.EUtils.getDNAForAccessions(dnaRefs,function(err,dnaObjs) {
				if(err != null) cb(err,null); else {
					var refMap = new haxe.ds.StringMap();
					var _g4 = 0;
					while(_g4 < dnaObjs.length) {
						var obj = dnaObjs[_g4];
						++_g4;
						var key = obj.getMoleculeName();
						if(__map_reserved[key] != null) refMap.setReserved(key,obj); else refMap.h[key] = obj;
					}
					var _g5 = 0;
					while(_g5 < protObjs.length) {
						var protObj1 = protObjs[_g5];
						++_g5;
						var dnaAccession = protObj1.getDNA().getMoleculeName();
						if(__map_reserved[dnaAccession] != null?refMap.existsReserved(dnaAccession):refMap.h.hasOwnProperty(dnaAccession)) {
							var dna1;
							dna1 = __map_reserved[dnaAccession] != null?refMap.getReserved(dnaAccession):refMap.h[dnaAccession];
							protObj1.setDNA(dna1);
							var coords = protObj1.getReferenceCoordinates().split("..");
							if(coords.length > 2) {
								cb("Invalid coordinate string for " + protObj1.getMoleculeName() + " " + protObj1.getReferenceCoordinates(),null);
								return;
							}
							dna1.setSequence(dna1.getRegion(Std.parseInt(coords[0]),Std.parseInt(coords[1])));
							var protSeq = dna1.getFrameTranslation(saturn.core.GeneticCodes.STANDARD,saturn.core.Frame.ONE);
						} else {
							cb(dnaAccession + " not found",null);
							return;
						}
					}
					cb(null,protObjs);
				}
			});
		} else cb(null,protObjs);
	});
	c1.catch(function(d){cb(d)});;
};
saturn.core.EUtils.getDNAForAccessions = function(accessions,cb) {
	var c1 = saturn.core.EUtils.eutils.efetch({ db : "nucleotide", id : accessions, retmode : "xml"}).then(function(d) {
		var objs;
		if((d.GBSet.GBSeq instanceof Array) && d.GBSet.GBSeq.__enum__ == null) objs = d.GBSet.GBSeq; else objs = [d.GBSet.GBSeq];
		if(objs == null || objs.length == 0) {
			cb("Unable to retrieve proteins for  " + accessions.join(","),null);
			return;
		}
		var dnaObjs = [];
		var _g = 0;
		while(_g < objs.length) {
			var seqObj = objs[_g];
			++_g;
			var dna = new saturn.core.DNA(seqObj.GBSeq_sequence);
			dnaObjs.push(dna);
			dna.setMoleculeName(Reflect.field(seqObj,"GBSeq_accession-version"));
			if(Object.prototype.hasOwnProperty.call(seqObj,"GBSeq_other-seqids")) {
				var seqIdElems = Reflect.field(Reflect.field(seqObj,"GBSeq_other-seqids"),"GBSeqid");
				var _g1 = 0;
				while(_g1 < seqIdElems.length) {
					var seqIdElem = seqIdElems[_g1];
					++_g1;
					var seqId = seqIdElem;
					if(seqId.indexOf("gi|") == 0) {
						dna.setAlternativeName(seqId);
						break;
					}
				}
			}
		}
		cb(null,dnaObjs);
	});
	c1.catch(function(d){cb(d)});;
};
saturn.core.EUtils.getProteinGIsForGene = function(geneId,cb) {
	var c1 = saturn.core.EUtils.eutils.esearch({ db : "gene", term : geneId}).then(saturn.core.EUtils.eutils.elink({ dbto : "protein"})).then(function(d) {
		saturn.core.Util.debug("");
		var found = false;
		if(Object.prototype.hasOwnProperty.call(d,"linksets")) {
			var linksets = d.linksets;
			if(linksets.length > 0) {
				if(Object.prototype.hasOwnProperty.call(linksets[0],"linksetdbs")) {
					var linksetdbs = linksets[0].linksetdbs;
					if(linksetdbs.length > 0) {
						var _g = 0;
						while(_g < linksetdbs.length) {
							var set = linksetdbs[_g];
							++_g;
							if(set.linkname == "gene_protein_refseq") {
								var ids = set.links;
								cb(null,ids);
								found = true;
								break;
							}
						}
					}
				}
			}
		}
		if(!found) cb("Unable to lookup gene entry " + geneId,null);
	});
	c1.catch(function(d){cb(d)});;
};
saturn.core.EUtils.insertProteins = function(objs,cb) {
	var run = null;
	run = function() {
		if(objs.length == 0) return;
		var protein = objs.pop();
		saturn.core.Util.debug("Inserting: " + protein.getMoleculeName());
		saturn.core.Protein.insertTranslation(protein.getDNA().getMoleculeName(),protein.getDNA().getAlternativeName(),protein.getDNA().getSequence(),"NUCLEOTIDE",protein.getMoleculeName(),protein.getAlternativeName(),protein.getSequence(),"PROTEIN","7158","GENE",function(err) {
			if(err != null) saturn.core.Util.debug(err); else run();
		});
	};
	run();
};
saturn.core.EUtils.getGeneInfo = function(geneId,cb) {
	saturn.core.Util.debug("Fetching gene record (tends to be very slow)");
	var c1 = saturn.core.EUtils.eutils.efetch({ db : "gene", id : geneId}).then(function(d) {
		var set1 = Reflect.field(d,"Entrezgene-Set");
		var set2 = Reflect.field(set1,"Entrezgene");
		var set3 = Reflect.field(set2,"Entrezgene_gene");
		var set4 = Reflect.field(set3,"Gene-ref");
		cb(null,{ symbol : Reflect.field(set4,"Gene-ref_locus"), description : Reflect.field(set4,"Gene-ref_desc")});
	});
	c1.catch(function(d){cb(d)});;
};
saturn.core.EUtils.prototype = {
	__class__: saturn.core.EUtils
};
saturn.core.EntityType = $hxClasses["saturn.core.EntityType"] = function() {
};
saturn.core.EntityType.__name__ = ["saturn","core","EntityType"];
saturn.core.EntityType.prototype = {
	id: null
	,name: null
	,__class__: saturn.core.EntityType
};
saturn.core.FileShim = $hxClasses["saturn.core.FileShim"] = function(name,base64) {
	this.name = name;
	this.base64 = base64;
};
saturn.core.FileShim.__name__ = ["saturn","core","FileShim"];
saturn.core.FileShim.prototype = {
	name: null
	,base64: null
	,getAsText: function() {
		return window.atob(this.base64);
	}
	,getAsArrayBuffer: function() {
		var bstr = window.atob(this.base64);
		var buffer = new Uint8Array(bstr.length);
		var _g1 = 0;
		var _g = bstr.length;
		while(_g1 < _g) {
			var i = _g1++;
			buffer[i] = HxOverrides.cca(bstr,i);
		}
		return buffer;
	}
	,__class__: saturn.core.FileShim
};
saturn.core.Generator = $hxClasses["saturn.core.Generator"] = function(limit) {
	this.limit = limit;
	this.processed = 0;
	this.done = false;
	this.items = [];
	this.maxAtOnce = 1;
};
saturn.core.Generator.__name__ = ["saturn","core","Generator"];
saturn.core.Generator.prototype = {
	limit: null
	,processed: null
	,done: null
	,cb: null
	,endCb: null
	,maxAtOnce: null
	,items: null
	,push: function(item) {
		this.items.push(item);
	}
	,pop: function(item) {
		return this.items.pop();
	}
	,die: function(err) {
		saturn.core.Util.debug(err);
		this.stop(err);
	}
	,stop: function(err) {
		this.finished();
		this.endCb(err);
	}
	,next: function() {
		var _g = this;
		if(this.done && this.items.length == 0 || this.limit != -1 && this.processed == this.limit) {
			this.endCb(null);
			return;
		} else if(this.items.length > 0) {
			if(this.maxAtOnce != 1) {
				var list = [];
				var added = 0;
				while(this.items.length > 0) {
					var item = this.items.pop();
					list.push(item);
					this.processed++;
					added++;
					if(added == this.maxAtOnce) break;
				}
				this.cb(list,function() {
					haxe.Timer.delay($bind(_g,_g.next),1);
				},this);
			} else {
				var item1 = this.items.pop();
				this.processed++;
				this.cb(item1,function() {
					haxe.Timer.delay($bind(_g,_g.next),1);
				},this);
			}
		} else {
			saturn.core.Util.debug("waiting");
			haxe.Timer.delay($bind(this,this.next),100);
		}
	}
	,count: function() {
		return this.processed;
	}
	,setMaxAtOnce: function(maxAtOnce) {
		this.maxAtOnce = maxAtOnce;
	}
	,setLimit: function(limit) {
		this.limit = limit;
	}
	,onEnd: function(cb) {
		this.endCb = cb;
	}
	,onNext: function(cb) {
		this.cb = cb;
		this.next();
	}
	,finished: function() {
		this.done = true;
	}
	,__class__: saturn.core.Generator
};
saturn.core.LocusPosition = $hxClasses["saturn.core.LocusPosition"] = function() {
};
saturn.core.LocusPosition.__name__ = ["saturn","core","LocusPosition"];
saturn.core.LocusPosition.prototype = {
	start: null
	,end: null
	,missMatchPositions: null
	,__class__: saturn.core.LocusPosition
};
saturn.core.Protein = $hxClasses["saturn.core.Protein"] = function(seq) {
	this.max_pH = 13;
	this.min_pH = 3;
	this.threshold = 0.1;
	this.lu_extinction = (function($this) {
		var $r;
		var _g = new haxe.ds.StringMap();
		if(__map_reserved.Y != null) _g.setReserved("Y",1490); else _g.h["Y"] = 1490;
		if(__map_reserved.W != null) _g.setReserved("W",5500); else _g.h["W"] = 5500;
		if(__map_reserved.C != null) _g.setReserved("C",125); else _g.h["C"] = 125;
		$r = _g;
		return $r;
	}(this));
	this.lu_charge = (function($this) {
		var $r;
		var _g = new haxe.ds.StringMap();
		if(__map_reserved.D != null) _g.setReserved("D",-1); else _g.h["D"] = -1;
		if(__map_reserved.E != null) _g.setReserved("E",-1); else _g.h["E"] = -1;
		if(__map_reserved.H != null) _g.setReserved("H",1); else _g.h["H"] = 1;
		if(__map_reserved.Y != null) _g.setReserved("Y",-1); else _g.h["Y"] = -1;
		if(__map_reserved.K != null) _g.setReserved("K",1); else _g.h["K"] = 1;
		if(__map_reserved.R != null) _g.setReserved("R",1); else _g.h["R"] = 1;
		if(__map_reserved.C != null) _g.setReserved("C",-1); else _g.h["C"] = -1;
		if(__map_reserved["N-Term"] != null) _g.setReserved("N-Term",1); else _g.h["N-Term"] = 1;
		if(__map_reserved["C-Term"] != null) _g.setReserved("C-Term",-1); else _g.h["C-Term"] = -1;
		$r = _g;
		return $r;
	}(this));
	this.lu_pKa = (function($this) {
		var $r;
		var _g = new haxe.ds.StringMap();
		if(__map_reserved.D != null) _g.setReserved("D",4.05); else _g.h["D"] = 4.05;
		if(__map_reserved.E != null) _g.setReserved("E",4.45); else _g.h["E"] = 4.45;
		if(__map_reserved.H != null) _g.setReserved("H",5.98); else _g.h["H"] = 5.98;
		if(__map_reserved.Y != null) _g.setReserved("Y",10); else _g.h["Y"] = 10;
		if(__map_reserved.K != null) _g.setReserved("K",10.4); else _g.h["K"] = 10.4;
		if(__map_reserved.R != null) _g.setReserved("R",12.5); else _g.h["R"] = 12.5;
		if(__map_reserved.C != null) _g.setReserved("C",9); else _g.h["C"] = 9;
		if(__map_reserved["N-Term"] != null) _g.setReserved("N-Term",8); else _g.h["N-Term"] = 8;
		if(__map_reserved["C-Term"] != null) _g.setReserved("C-Term",3.55); else _g.h["C-Term"] = 3.55;
		$r = _g;
		return $r;
	}(this));
	this.hydrophobicityLookUp = (function($this) {
		var $r;
		var _g = new haxe.ds.StringMap();
		if(__map_reserved.A != null) _g.setReserved("A",1.8); else _g.h["A"] = 1.8;
		if(__map_reserved.G != null) _g.setReserved("G",-0.4); else _g.h["G"] = -0.4;
		if(__map_reserved.M != null) _g.setReserved("M",1.9); else _g.h["M"] = 1.9;
		if(__map_reserved.S != null) _g.setReserved("S",-0.8); else _g.h["S"] = -0.8;
		if(__map_reserved.C != null) _g.setReserved("C",2.5); else _g.h["C"] = 2.5;
		if(__map_reserved.H != null) _g.setReserved("H",-3.2); else _g.h["H"] = -3.2;
		if(__map_reserved.N != null) _g.setReserved("N",-3.5); else _g.h["N"] = -3.5;
		if(__map_reserved.T != null) _g.setReserved("T",-0.7); else _g.h["T"] = -0.7;
		if(__map_reserved.D != null) _g.setReserved("D",-3.5); else _g.h["D"] = -3.5;
		if(__map_reserved.I != null) _g.setReserved("I",4.5); else _g.h["I"] = 4.5;
		if(__map_reserved.P != null) _g.setReserved("P",-1.6); else _g.h["P"] = -1.6;
		if(__map_reserved.V != null) _g.setReserved("V",4.2); else _g.h["V"] = 4.2;
		if(__map_reserved.E != null) _g.setReserved("E",-3.5); else _g.h["E"] = -3.5;
		if(__map_reserved.K != null) _g.setReserved("K",-3.9); else _g.h["K"] = -3.9;
		if(__map_reserved.Q != null) _g.setReserved("Q",-3.5); else _g.h["Q"] = -3.5;
		if(__map_reserved.W != null) _g.setReserved("W",-0.9); else _g.h["W"] = -0.9;
		if(__map_reserved.F != null) _g.setReserved("F",2.8); else _g.h["F"] = 2.8;
		if(__map_reserved.L != null) _g.setReserved("L",3.8); else _g.h["L"] = 3.8;
		if(__map_reserved.R != null) _g.setReserved("R",-4.5); else _g.h["R"] = -4.5;
		if(__map_reserved.Y != null) _g.setReserved("Y",-1.3); else _g.h["Y"] = -1.3;
		$r = _g;
		return $r;
	}(this));
	saturn.core.molecule.Molecule.call(this,seq);
};
saturn.core.Protein.__name__ = ["saturn","core","Protein"];
saturn.core.Protein._insertGene = function(geneId,source,cb) {
	var provider = saturn.core.Util.getProvider();
	provider.getById(geneId,saturn.core.domain.Entity,function(obj,err) {
		if(err != null) cb(err); else if(obj != null) cb(null); else {
			var gene = new saturn.core.domain.Entity();
			gene.entityId = geneId;
			gene.source = new saturn.core.domain.DataSource();
			gene.source.name = source;
			gene.entityType = new saturn.core.EntityType();
			gene.entityType.name = "DNA";
			saturn.core.EUtils.getGeneInfo(Std.parseInt(geneId),function(err1,info) {
				gene.altName = info.symbol;
				gene.description = info.description;
				provider.insertObjects([gene],function(err2) {
					cb(err2);
				});
			});
		}
	});
};
saturn.core.Protein.insertTranslation = function(dnaId,dnaAltName,dnaSeq,dnaSource,protId,protAltName,protSeq,protSource,geneId,geneSource,cb) {
	var provider = saturn.core.Util.getProvider();
	saturn.core.Protein._insertGene(geneId,geneSource,function(err) {
		if(err != null) cb(err); else {
			var dna = new saturn.core.domain.Entity();
			dna.entityId = dnaId;
			dna.altName = dnaAltName;
			dna.source = new saturn.core.domain.DataSource();
			dna.source.name = dnaSource;
			dna.entityType = new saturn.core.EntityType();
			dna.entityType.name = "DNA";
			var dna_mol = new saturn.core.domain.Molecule();
			dna_mol.entity = dna;
			dna_mol.sequence = dnaSeq;
			var annotation = new saturn.core.domain.MoleculeAnnotation();
			annotation.entity = dna;
			annotation.referent = new saturn.core.domain.Entity();
			annotation.referent.entityId = geneId;
			annotation.referent.source = new saturn.core.domain.DataSource();
			annotation.referent.source.name = "GENE";
			var prot = new saturn.core.domain.Entity();
			prot.entityId = protId;
			prot.altName = protAltName;
			prot.source = new saturn.core.domain.DataSource();
			prot.source.name = protSource;
			prot.entityType = new saturn.core.EntityType();
			prot.entityType.name = "PROTEIN";
			var prot_mol = new saturn.core.domain.Molecule();
			prot_mol.entity = prot;
			prot_mol.sequence = protSeq;
			var reaction = new saturn.core.Reaction();
			reaction.name = dnaId + "-TRANS";
			reaction.reactionType = new saturn.core.ReactionType();
			reaction.reactionType.name = "TRANSLATION";
			prot.reaction = reaction;
			var reactionComp = new saturn.core.ReactionComponent();
			reactionComp.entity = dna;
			reactionComp.reactionRole = new saturn.core.ReactionRole();
			reactionComp.reactionRole.name = "TEMPLATE";
			reactionComp.reaction = reaction;
			reactionComp.position = 1;
			provider.insertObjects([dna],function(err1) {
				if(err1 != null) cb(err1); else provider.insertObjects([dna_mol],function(err2) {
					if(err2 != null) cb(err2); else provider.insertObjects([reaction],function(err3) {
						if(err3 != null) cb(err3); else provider.insertObjects([reactionComp],function(err4) {
							if(err4 != null) cb(err4); else provider.insertObjects([prot],function(err5) {
								if(err5 != null) cb(err5); else provider.insertObjects([prot_mol],function(err6) {
									if(err6 != null) cb(err6); else provider.insertObjects([annotation],function(err7) {
										if(err7 != null) saturn.core.Util.debug(err7);
										cb(err7);
									});
								});
							});
						});
					});
				});
			});
		}
	});
};
saturn.core.Protein.isProtein = function(sequence) {
	var seqLen = sequence.length;
	var valid_res = saturn.core.GeneticCodeRegistry.getDefault().getAAToCodonTable();
	var _g = 0;
	while(_g < seqLen) {
		var i = _g++;
		var res = sequence.charAt(i).toUpperCase();
		if(!(__map_reserved[res] != null?valid_res.existsReserved(res):valid_res.h.hasOwnProperty(res))) return false;
	}
	return true;
};
saturn.core.Protein.__super__ = saturn.core.molecule.Molecule;
saturn.core.Protein.prototype = $extend(saturn.core.molecule.Molecule.prototype,{
	dna: null
	,coordinates: null
	,hydrophobicityLookUp: null
	,lu_pKa: null
	,lu_charge: null
	,lu_extinction: null
	,threshold: null
	,min_pH: null
	,max_pH: null
	,setSequence: function(sequence) {
		saturn.core.molecule.Molecule.prototype.setSequence.call(this,sequence);
		if(sequence != null) {
			var mSet = saturn.core.molecule.MoleculeSetRegistry.getStandardMoleculeSet();
			var mw = mSet.getMolecule("H2O").getFloatAttribute(saturn.core.molecule.MoleculeFloatAttribute.MW);
			var _g1 = 0;
			var _g = this.sequence.length;
			while(_g1 < _g) {
				var i = _g1++;
				var molecule = mSet.getMolecule(this.sequence.charAt(i));
				if(molecule != null) mw += molecule.getFloatAttribute(saturn.core.molecule.MoleculeFloatAttribute.MW_CONDESATION); else {
					mw = -1;
					break;
				}
			}
			this.setFloatAttribute(saturn.core.molecule.MoleculeFloatAttribute.MW,mw);
		}
		if(this.isLinked()) {
			var d = this.getParent();
			if(d != null) d.proteinSequenceUpdated(this.sequence);
		}
	}
	,getHydrophobicity: function() {
		var proteinSequence = this.sequence;
		var seqLength = this.sequence.length;
		var totalGravy = 0.0;
		var averageGravy = 0.0;
		var _g = 0;
		while(_g < seqLength) {
			var i = _g++;
			var aminoAcid = HxOverrides.substr(proteinSequence,i,1);
			var hydroValue = this.hydrophobicityLookUp.get(aminoAcid);
			totalGravy += hydroValue;
		}
		averageGravy = totalGravy / seqLength;
		return averageGravy;
	}
	,setDNA: function(dna) {
		this.dna = dna;
	}
	,dnaSequenceUpdated: function(sequence) {
	}
	,getDNA: function() {
		return this.dna;
	}
	,setReferenceCoordinates: function(coordinates) {
		this.coordinates = coordinates;
	}
	,getReferenceCoordinates: function() {
		return this.coordinates;
	}
	,getAminoAcidCharge: function(aa,mid_pH) {
		var aminoAcid = aa;
		var pH = mid_pH;
		var ratio = 1 / (1 + Math.pow(10,pH - this.lu_pKa.get(aminoAcid)));
		if(this.lu_charge.get(aminoAcid) == 1) return ratio; else return ratio - 1;
	}
	,getProteinCharge: function(mid_pH) {
		var seqLength = this.sequence.length;
		var proteinSequence = this.sequence;
		var aa = "N-Term";
		var proteinCharge = this.getAminoAcidCharge(aa,mid_pH);
		aa = "C-Term";
		proteinCharge += this.getAminoAcidCharge(aa,mid_pH);
		var _g = 0;
		while(_g < seqLength) {
			var i = _g++;
			aa = HxOverrides.substr(proteinSequence,i,1);
			if(this.lu_pKa.exists(aa)) proteinCharge += this.getAminoAcidCharge(aa,mid_pH);
		}
		return proteinCharge;
	}
	,getpI: function() {
		var proteinSequence = this.sequence;
		while(true) {
			var mid_pH = 0.5 * (this.max_pH + this.min_pH);
			var proteinCharge = this.getProteinCharge(mid_pH);
			if(proteinCharge > this.threshold) this.min_pH = mid_pH; else if(proteinCharge < -this.threshold) this.max_pH = mid_pH; else return mid_pH;
		}
	}
	,getExtinctionNonReduced: function() {
		var proteinSequence = this.sequence;
		var seqLength = this.sequence.length;
		var aa;
		var extinctionNonReduced = 0.0;
		var numberCysteines = 0.0;
		var pairsCysteins = 0.0;
		var _g = 0;
		while(_g < seqLength) {
			var i = _g++;
			aa = HxOverrides.substr(proteinSequence,i,1);
			if(this.lu_extinction.exists(aa) && aa != "C") extinctionNonReduced += this.lu_extinction.get(aa);
			if(aa == "C") numberCysteines += 1;
		}
		if(numberCysteines % 2 == 0) pairsCysteins = numberCysteines / 2; else pairsCysteins = numberCysteines / 2 - 0.5;
		extinctionNonReduced += pairsCysteins * this.lu_extinction.get("C");
		return extinctionNonReduced;
	}
	,getExtinctionReduced: function() {
		var proteinSequence = this.sequence;
		var seqLength = this.sequence.length;
		var aa;
		var extinctionReduced = 0.0;
		var _g = 0;
		while(_g < seqLength) {
			var i = _g++;
			aa = HxOverrides.substr(proteinSequence,i,1);
			if(this.lu_extinction.exists(aa) && aa != "C") extinctionReduced += this.lu_extinction.get(aa);
		}
		return extinctionReduced;
	}
	,__class__: saturn.core.Protein
});
saturn.core.Reaction = $hxClasses["saturn.core.Reaction"] = function() {
};
saturn.core.Reaction.__name__ = ["saturn","core","Reaction"];
saturn.core.Reaction.prototype = {
	id: null
	,name: null
	,reactionTypeId: null
	,reactionType: null
	,__class__: saturn.core.Reaction
};
saturn.core.ReactionComponent = $hxClasses["saturn.core.ReactionComponent"] = function() {
};
saturn.core.ReactionComponent.__name__ = ["saturn","core","ReactionComponent"];
saturn.core.ReactionComponent.prototype = {
	id: null
	,position: null
	,reactionRoleId: null
	,entityId: null
	,reactionId: null
	,reaction: null
	,reactionRole: null
	,entity: null
	,__class__: saturn.core.ReactionComponent
};
saturn.core.ReactionRole = $hxClasses["saturn.core.ReactionRole"] = function() {
};
saturn.core.ReactionRole.__name__ = ["saturn","core","ReactionRole"];
saturn.core.ReactionRole.prototype = {
	id: null
	,name: null
	,__class__: saturn.core.ReactionRole
};
saturn.core.ReactionType = $hxClasses["saturn.core.ReactionType"] = function() {
};
saturn.core.ReactionType.__name__ = ["saturn","core","ReactionType"];
saturn.core.ReactionType.prototype = {
	id: null
	,name: null
	,__class__: saturn.core.ReactionType
};
saturn.core.RestrictionSite = $hxClasses["saturn.core.RestrictionSite"] = function(seq) {
	saturn.core.DNA.call(this,seq);
};
saturn.core.RestrictionSite.__name__ = ["saturn","core","RestrictionSite"];
saturn.core.RestrictionSite.__super__ = saturn.core.DNA;
saturn.core.RestrictionSite.prototype = $extend(saturn.core.DNA.prototype,{
	__class__: saturn.core.RestrictionSite
});
saturn.core.molecule.MoleculeSet = $hxClasses["saturn.core.molecule.MoleculeSet"] = function() {
	this.moleculeSet = new haxe.ds.StringMap();
};
saturn.core.molecule.MoleculeSet.__name__ = ["saturn","core","molecule","MoleculeSet"];
saturn.core.molecule.MoleculeSet.prototype = {
	moleculeSet: null
	,setMolecule: function(name,molecule) {
		this.moleculeSet.set(name,molecule);
	}
	,getMolecule: function(name) {
		return this.moleculeSet.get(name);
	}
	,__class__: saturn.core.molecule.MoleculeSet
};
saturn.core.StandardMoleculeSet = $hxClasses["saturn.core.StandardMoleculeSet"] = function() {
	saturn.core.molecule.MoleculeSet.call(this);
	var mMap = [{ 'NAME' : "A", 'MW' : 71.0788},{ 'NAME' : "R", 'MW' : 156.1875},{ 'NAME' : "N", 'MW' : 114.1038},{ 'NAME' : "D", 'MW' : 115.0886},{ 'NAME' : "C", 'MW' : 103.1448},{ 'NAME' : "E", 'MW' : 129.1155},{ 'NAME' : "Q", 'MW' : 128.1308},{ 'NAME' : "G", 'MW' : 57.052},{ 'NAME' : "H", 'MW' : 137.1412},{ 'NAME' : "I", 'MW' : 113.1595},{ 'NAME' : "L", 'MW' : 113.1595},{ 'NAME' : "K", 'MW' : 128.1742},{ 'NAME' : "M", 'MW' : 131.1986},{ 'NAME' : "F", 'MW' : 147.1766},{ 'NAME' : "P", 'MW' : 97.1167},{ 'NAME' : "S", 'MW' : 87.0782},{ 'NAME' : "T", 'MW' : 101.1051},{ 'NAME' : "W", 'MW' : 186.2133},{ 'NAME' : "Y", 'MW' : 163.176},{ 'NAME' : "V", 'MW' : 99.1326}];
	var _g = 0;
	while(_g < mMap.length) {
		var mDef = mMap[_g];
		++_g;
		var m = new saturn.core.molecule.Molecule(mDef.NAME);
		m.setFloatAttribute(saturn.core.molecule.MoleculeFloatAttribute.MW_CONDESATION,mDef.MW);
		m.setStringAttribute(saturn.core.molecule.MoleculeStringAttribute.NAME,mDef.NAME);
		this.setMolecule(mDef.NAME,m);
	}
	mMap = [{ 'NAME' : "H2O", 'MW' : 18.02}];
	var _g1 = 0;
	while(_g1 < mMap.length) {
		var mDef1 = mMap[_g1];
		++_g1;
		var m1 = new saturn.core.molecule.Molecule(mDef1.NAME);
		m1.setFloatAttribute(saturn.core.molecule.MoleculeFloatAttribute.MW,mDef1.MW);
		m1.setStringAttribute(saturn.core.molecule.MoleculeStringAttribute.NAME,mDef1.NAME);
		this.setMolecule(mDef1.NAME,m1);
	}
};
saturn.core.StandardMoleculeSet.__name__ = ["saturn","core","StandardMoleculeSet"];
saturn.core.StandardMoleculeSet.__super__ = saturn.core.molecule.MoleculeSet;
saturn.core.StandardMoleculeSet.prototype = $extend(saturn.core.molecule.MoleculeSet.prototype,{
	__class__: saturn.core.StandardMoleculeSet
});
saturn.core.TmCalc = $hxClasses["saturn.core.TmCalc"] = function() {
	this.deltaHTable = new haxe.ds.StringMap();
	this.deltaSTable = new haxe.ds.StringMap();
	this.endHTable = new haxe.ds.StringMap();
	this.endSTable = new haxe.ds.StringMap();
	this.populateDeltaHTable();
	this.populateDeltaSTable();
	this.populateEndHTable();
	this.populateEndSTable();
};
saturn.core.TmCalc.__name__ = ["saturn","core","TmCalc"];
saturn.core.TmCalc.prototype = {
	deltaHTable: null
	,deltaSTable: null
	,endHTable: null
	,endSTable: null
	,populateDeltaHTable: function() {
		this.deltaHTable.set("AA",-7900);
		this.deltaHTable.set("TT",-7900);
		this.deltaHTable.set("AT",-7200);
		this.deltaHTable.set("TA",-7200);
		this.deltaHTable.set("CA",-8500);
		this.deltaHTable.set("TG",-8500);
		this.deltaHTable.set("GT",-8400);
		this.deltaHTable.set("AC",-8400);
		this.deltaHTable.set("CT",-7800);
		this.deltaHTable.set("AG",-7800);
		this.deltaHTable.set("GA",-8200);
		this.deltaHTable.set("TC",-8200);
		this.deltaHTable.set("CG",-10600);
		this.deltaHTable.set("GC",-9800);
		this.deltaHTable.set("GG",-8000);
		this.deltaHTable.set("CC",-8000);
	}
	,populateDeltaSTable: function() {
		this.deltaSTable.set("AA",-22.2);
		this.deltaSTable.set("TT",-22.2);
		this.deltaSTable.set("AT",-20.4);
		this.deltaSTable.set("TA",-21.3);
		this.deltaSTable.set("CA",-22.7);
		this.deltaSTable.set("TG",-22.7);
		this.deltaSTable.set("GT",-22.4);
		this.deltaSTable.set("AC",-22.4);
		this.deltaSTable.set("CT",-21.0);
		this.deltaSTable.set("AG",-21.0);
		this.deltaSTable.set("GA",-22.2);
		this.deltaSTable.set("TC",-22.2);
		this.deltaSTable.set("CG",-27.2);
		this.deltaSTable.set("GC",-24.4);
		this.deltaSTable.set("GG",-19.9);
		this.deltaSTable.set("CC",-19.9);
	}
	,populateEndHTable: function() {
		this.endHTable.set("A",2300);
		this.endHTable.set("T",2300);
		this.endHTable.set("G",100);
		this.endHTable.set("C",100);
	}
	,populateEndSTable: function() {
		this.endSTable.set("A",4.1);
		this.endSTable.set("T",4.1);
		this.endSTable.set("G",-2.8);
		this.endSTable.set("C",-2.8);
	}
	,getDeltaH: function(primerSeq) {
		var dnaSeq = primerSeq.getSequence();
		var seqLen = dnaSeq.length;
		var startNuc = dnaSeq.charAt(0);
		var endNuc = dnaSeq.charAt(seqLen - 1);
		var startH = this.endHTable.get(startNuc);
		var endH = this.endHTable.get(endNuc);
		var deltaH = startH + endH;
		var _g = 1;
		while(_g < seqLen) {
			var i = _g++;
			var currNuc = dnaSeq.charAt(i);
			var currH = this.deltaHTable.get(startNuc + currNuc);
			startNuc = currNuc;
			deltaH = deltaH + currH;
		}
		return deltaH;
	}
	,getDeltaS: function(primerSeq) {
		var dnaSeq = primerSeq.getSequence();
		var seqLen = dnaSeq.length;
		var startNuc = dnaSeq.charAt(0);
		var endNuc = dnaSeq.charAt(seqLen - 1);
		var startS = this.endSTable.get(startNuc);
		var endS = this.endSTable.get(endNuc);
		var deltaS = startS + endS;
		var _g = 1;
		while(_g < seqLen) {
			var i = _g++;
			var currNuc = dnaSeq.charAt(i);
			var currS = this.deltaSTable.get(startNuc + currNuc);
			startNuc = currNuc;
			deltaS = deltaS + currS;
		}
		return deltaS;
	}
	,saltCorrection: function(primerSeq,saltConc) {
		var saltPenalty = 0.368;
		var dnaSeq = primerSeq.getSequence();
		var seqLen = dnaSeq.length;
		saltConc = saltConc / 1000.0;
		var lnSalt = Math.log(saltConc);
		var deltaS = this.getDeltaS(primerSeq);
		var saltCorrDeltaS = deltaS + saltPenalty * (seqLen - 1) * lnSalt;
		return saltCorrDeltaS;
	}
	,tmCalculation: function(primerSeq,saltConc,primerConc) {
		var deltaH = this.getDeltaH(primerSeq);
		var saltCorrDeltaS = this.saltCorrection(primerSeq,saltConc);
		var gasConst = 1.987;
		var lnPrimerConc = Math.log(primerConc / 1000000000 / 2);
		var tmKelvin = deltaH / (saltCorrDeltaS + gasConst * lnPrimerConc);
		var tmCelcius = tmKelvin - 273.15;
		if(tmCelcius > 75) return 75; else return tmCelcius;
	}
	,__class__: saturn.core.TmCalc
};
saturn.core.User = $hxClasses["saturn.core.User"] = function() {
};
saturn.core.User.__name__ = ["saturn","core","User"];
saturn.core.User.prototype = {
	id: null
	,username: null
	,password: null
	,firstname: null
	,lastname: null
	,email: null
	,fullname: null
	,uuid: null
	,token: null
	,projects: null
	,__class__: saturn.core.User
};
saturn.core.Util = $hxClasses["saturn.core.Util"] = function() {
};
saturn.core.Util.__name__ = ["saturn","core","Util"];
saturn.core.Util.debug = function(msg) {
	saturn.app.SaturnServer.getDefaultServer().debug(msg);
};
saturn.core.Util.inspect = function(obj) {
	js.Node.console.log(obj);
};
saturn.core.Util.print = function(msg) {
	js.Node.console.log(msg);
};
saturn.core.Util.openw = function(path) {
	return saturn.core.Util.fs.createWriteStream(path);
};
saturn.core.Util.opentemp = function(prefix,cb) {
	saturn.core.Util.temp.open(prefix,function(error,info) {
		cb(error,new saturn.core.Stream(info.fd),info.path);
	});
};
saturn.core.Util.isHostEnvironmentAvailable = function() {
	return false;
};
saturn.core.Util.exec = function(program,args,cb) {
	var proc = js.Node.require("child_process").spawn(program,args);
	proc.stderr.on("data",function(error) {
		saturn.core.Util.debug(error.toString("utf8"));
	});
	proc.stdout.on("data",function(msg) {
		saturn.core.Util.debug(msg.toString("utf8"));
	});
	proc.on("close",function(code) {
		saturn.core.Util.debug("Closed");
		cb(code);
	});
	proc.on("error",function(error1) {
		saturn.core.Util.debug(error1);
		cb(-1);
	});
	saturn.core.Util.debug("Hello X");
};
saturn.core.Util.getNewExternalProcess = function(cb) {
};
saturn.core.Util.getNewFileDialog = function(cb) {
};
saturn.core.Util.saveFileAsDialog = function(contents,cb) {
};
saturn.core.Util.saveFile = function(fileName,contents,cb) {
};
saturn.core.Util.jsImports = function(paths,cb) {
	var errs = new haxe.ds.StringMap();
	var next = null;
	next = function() {
		if(paths.length == 0) cb(errs); else {
			var path = paths.pop();
			saturn.core.Util.jsImport(path,function(err) {
				if(__map_reserved[path] != null) errs.setReserved(path,err); else errs.h[path] = err;
				next();
			});
		}
	};
	next();
};
saturn.core.Util.jsImport = function(path,cb) {
};
saturn.core.Util.openFileAsDialog = function(cb) {
};
saturn.core.Util.readFile = function(fileName,cb) {
};
saturn.core.Util.open = function(path,cb) {
	saturn.core.Util.fs.createReadStream(path).pipe(saturn.core.Util.split()).on("data",function(line) {
		cb(null,line);
	}).on("error",function(err) {
		cb(err,null);
	}).on("end",function() {
		cb(null,null);
	});
};
saturn.core.Util.getProvider = function() {
	return saturn.client.core.CommonCore.getDefaultProvider();
};
saturn.core.Util.string = function(a) {
	return Std.string(a);
};
saturn.core.Util.clone = function(obj) {
	var ser = haxe.Serializer.run(obj);
	return haxe.Unserializer.run(ser);
};
saturn.core.Util.prototype = {
	__class__: saturn.core.Util
};
saturn.core.Stream = $hxClasses["saturn.core.Stream"] = function(streamId) {
	this.streamId = streamId;
};
saturn.core.Stream.__name__ = ["saturn","core","Stream"];
saturn.core.Stream.prototype = {
	streamId: null
	,write: function(content) {
		saturn.core.Util.fs.write(this.streamId,content);
	}
	,end: function(cb) {
		saturn.core.Util.fs.close(this.streamId,cb);
	}
	,__class__: saturn.core.Stream
};
if(!saturn.core.domain) saturn.core.domain = {};
saturn.core.domain.DataSource = $hxClasses["saturn.core.domain.DataSource"] = function() {
};
saturn.core.domain.DataSource.__name__ = ["saturn","core","domain","DataSource"];
saturn.core.domain.DataSource.getEntities = function(source,cb) {
	var p = saturn.core.Util.getProvider();
	p.getById(source,saturn.core.domain.DataSource,function(obj,err) {
		if(err != null) cb(err,null); else if(obj == null) cb("Data source not found " + source,null); else {
			saturn.core.Util.debug("Retreiving records for source " + source);
			p.getByValues([saturn.core.Util.string(obj.id)],saturn.core.domain.Entity,"dataSourceId",function(objs,error) {
				saturn.core.Util.debug("Entities retrieved for source " + source);
				if(error != null) cb("An error occurred retrieving data source " + source + " entities\n" + error,null); else cb(null,objs);
			});
		}
	});
};
saturn.core.domain.DataSource.getSource = function(source,insert,cb) {
	var p = saturn.core.Util.getProvider();
	p.getById(source,saturn.core.domain.DataSource,function(obj,err) {
		if(err != null) cb("An error occurred looking for source: " + source + "\n" + err,null); else if(obj == null) {
			if(insert) {
				var obj1 = new saturn.core.domain.DataSource();
				obj1.name = source;
				p.insert(source,function(err1) {
					if(err1 != null) cb("An error occurred inserting source: " + source + "\n" + err1,null); else p.getById(source,saturn.core.domain.DataSource,function(obj2,err2) {
						if(err2 != null) cb("An error occurred looking for source: " + source + "\n" + err2,null); else if(obj2 == null) cb("Inserted source " + source + " could not be found",null); else cb(null,obj2);
					});
				});
			} else cb(null,null);
		} else cb(null,obj);
	});
};
saturn.core.domain.DataSource.prototype = {
	id: null
	,name: null
	,__class__: saturn.core.domain.DataSource
};
saturn.core.domain.Entity = $hxClasses["saturn.core.domain.Entity"] = function() {
};
saturn.core.domain.Entity.__name__ = ["saturn","core","domain","Entity"];
saturn.core.domain.Entity.insertList = function(ids,source,cb) {
	var uqx = new haxe.ds.StringMap();
	var _g = 0;
	while(_g < ids.length) {
		var id = ids[_g];
		++_g;
		if(__map_reserved[id] != null) uqx.setReserved(id,id); else uqx.h[id] = id;
	}
	ids = [];
	var $it0 = uqx.keys();
	while( $it0.hasNext() ) {
		var id1 = $it0.next();
		ids.push(id1);
	}
	saturn.core.domain.DataSource.getSource(source,false,function(err,sourceObj) {
		if(err != null) cb(err,null); else if(sourceObj == null) cb("Unable to find source " + source,null); else {
			var objs = [];
			var _g1 = 0;
			while(_g1 < ids.length) {
				var id2 = ids[_g1];
				++_g1;
				var entity = new saturn.core.domain.Entity();
				entity.entityId = id2;
				entity.dataSourceId = sourceObj.id;
				objs.push(entity);
			}
			var p = saturn.core.Util.getProvider();
			p.insertObjects(objs,function(err1) {
				if(err1 != null) cb("An error occurred inserting entities\n" + err1,null); else p.getByIds(ids,saturn.core.domain.Entity,function(objs1,err2) {
					if(err2 != null) cb("An error occurred looking for inserted objects\n" + err2,null); else cb(null,objs1);
				});
			});
		}
	});
};
saturn.core.domain.Entity.getObjects = function(ids,cb) {
	var p = saturn.core.Util.getProvider();
	p.getByIds(ids,saturn.core.domain.Entity,function(objs,err) {
		if(err != null) cb(err,null); else cb(null,objs);
	});
};
saturn.core.domain.Entity.prototype = {
	id: null
	,entityId: null
	,dataSourceId: null
	,reactionId: null
	,entityTypeId: null
	,altName: null
	,description: null
	,source: null
	,reaction: null
	,entityType: null
	,__class__: saturn.core.domain.Entity
};
saturn.core.domain.FileProxy = $hxClasses["saturn.core.domain.FileProxy"] = function() {
};
saturn.core.domain.FileProxy.__name__ = ["saturn","core","domain","FileProxy"];
saturn.core.domain.FileProxy.prototype = {
	path: null
	,content: null
	,__class__: saturn.core.domain.FileProxy
};
saturn.core.domain.Molecule = $hxClasses["saturn.core.domain.Molecule"] = function() {
};
saturn.core.domain.Molecule.__name__ = ["saturn","core","domain","Molecule"];
saturn.core.domain.Molecule.prototype = {
	id: null
	,name: null
	,sequence: null
	,entityId: null
	,entity: null
	,__class__: saturn.core.domain.Molecule
};
saturn.core.domain.MoleculeAnnotation = $hxClasses["saturn.core.domain.MoleculeAnnotation"] = function() {
};
saturn.core.domain.MoleculeAnnotation.__name__ = ["saturn","core","domain","MoleculeAnnotation"];
saturn.core.domain.MoleculeAnnotation.prototype = {
	id: null
	,entityId: null
	,labelId: null
	,start: null
	,stop: null
	,evalue: null
	,altevalue: null
	,entity: null
	,referent: null
	,__class__: saturn.core.domain.MoleculeAnnotation
};
saturn.core.domain.Uploader = $hxClasses["saturn.core.domain.Uploader"] = function(source,evalue) {
	this.initialised = false;
	this.source = source;
	this.cutoff = evalue;
};
saturn.core.domain.Uploader.__name__ = ["saturn","core","domain","Uploader"];
saturn.core.domain.Uploader.prototype = {
	referentMap: null
	,provider: null
	,generator: null
	,initialised: null
	,source: null
	,cutoff: null
	,next: function(items,generator) {
		var _g = this;
		this.generator = generator;
		if(this.initialised == false) {
			this.provider = saturn.core.Util.getProvider();
			this.setupReferentMap(function(err) {
				if(err != null) generator.die(err); else {
					_g.initialised = true;
					_g.next(items,generator);
				}
			});
		} else {
			if(items.length == 0) return;
			var ids = saturn.db.Model.generateUniqueListWithField(items,"entity.entityId");
			var acList = saturn.db.Model.generateUniqueListWithField(items,"referent.entityId");
			var newReferents = [];
			var _g1 = 0;
			while(_g1 < acList.length) {
				var id = acList[_g1];
				++_g1;
				if(!this.referentMap.exists(id)) newReferents.push(id);
			}
			var _g2 = 0;
			while(_g2 < items.length) {
				var item = items[_g2];
				++_g2;
				if(item.evalue > this.cutoff) HxOverrides.remove(items,item);
			}
			this.insertReferents(newReferents,function(err1) {
				if(err1 != null) generator.die(err1); else _g.provider.insertObjects(items,function(err2) {
					if(err2 != null) generator.die(err2); else generator.next();
				});
			});
		}
	}
	,setupReferentMap: function(cb) {
		var _g = this;
		saturn.core.domain.DataSource.getEntities(this.source,function(err,objs) {
			if(err != null) cb(err); else {
				_g.referentMap = saturn.db.Model.generateIDMap(objs);
				cb(null);
			}
		});
	}
	,insertReferents: function(accessions,cb) {
		var _g1 = this;
		if(accessions.length == 0) cb(null); else saturn.core.domain.Entity.insertList(accessions,this.source,function(err,objs) {
			if(err == null) {
				var _g = 0;
				while(_g < objs.length) {
					var obj = objs[_g];
					++_g;
					_g1.referentMap.set(obj.entityId,obj.id);
				}
			}
			cb(err);
		});
	}
	,__class__: saturn.core.domain.Uploader
};
saturn.core.domain.SgcAllele = $hxClasses["saturn.core.domain.SgcAllele"] = function() {
	saturn.core.DNA.call(this,null);
	this.setup();
};
saturn.core.domain.SgcAllele.__name__ = ["saturn","core","domain","SgcAllele"];
saturn.core.domain.SgcAllele.__super__ = saturn.core.DNA;
saturn.core.domain.SgcAllele.prototype = $extend(saturn.core.DNA.prototype,{
	alleleId: null
	,id: null
	,entryCloneId: null
	,forwardPrimerId: null
	,reversePrimerId: null
	,dnaSeq: null
	,proteinSeq: null
	,plateWell: null
	,plate: null
	,entryClone: null
	,elnId: null
	,alleleStatus: null
	,complex: null
	,forwardPrimer: null
	,reversePrimer: null
	,proteinSequenceObj: null
	,setup: function() {
		this.setSequence(this.dnaSeq);
		this.sequenceField = "dnaSeq";
		if(this.proteinSequenceObj == null) this.proteinSequenceObj = new saturn.core.Protein(null);
		this.addProtein("Translation",this.proteinSequenceObj);
	}
	,getMoleculeName: function() {
		return this.alleleId;
	}
	,loadProtein: function(cb) {
		this.proteinSequenceObj.setName(this.alleleId + " (Protein)");
		this.proteinSequenceObj.setDNA(this);
		cb(this.proteinSequenceObj);
	}
	,setSequence: function(sequence) {
		saturn.core.DNA.prototype.setSequence.call(this,sequence);
		this.dnaSeq = sequence;
	}
	,__class__: saturn.core.domain.SgcAllele
});
saturn.core.domain.SgcAllelePlate = $hxClasses["saturn.core.domain.SgcAllelePlate"] = function() {
};
saturn.core.domain.SgcAllelePlate.__name__ = ["saturn","core","domain","SgcAllelePlate"];
saturn.core.domain.SgcAllelePlate.prototype = {
	plateName: null
	,id: null
	,elnRef: null
	,setup: function() {
	}
	,loadPlate: function(cb) {
	}
	,__class__: saturn.core.domain.SgcAllelePlate
};
saturn.core.domain.SgcEntryClone = $hxClasses["saturn.core.domain.SgcEntryClone"] = function() {
	saturn.core.DNA.call(this,null);
	this.setup();
};
saturn.core.domain.SgcEntryClone.__name__ = ["saturn","core","domain","SgcEntryClone"];
saturn.core.domain.SgcEntryClone.__super__ = saturn.core.DNA;
saturn.core.domain.SgcEntryClone.prototype = $extend(saturn.core.DNA.prototype,{
	entryCloneId: null
	,id: null
	,dnaSeq: null
	,target: null
	,seqSource: null
	,sourceId: null
	,sequenceConfirmed: null
	,elnId: null
	,complex: null
	,proteinSequenceObj: null
	,getMoleculeName: function() {
		return this.entryCloneId;
	}
	,setup: function() {
		this.setSequence(this.dnaSeq);
		if(this.dnaSeq != null && this.dnaSeq != "" && this.dnaSeq.length > 2) this.proteinSequenceObj = new saturn.core.Protein(this.getFrameTranslation(saturn.core.GeneticCodes.STANDARD,saturn.core.Frame.ONE)); else this.proteinSequenceObj = new saturn.core.Protein(null);
		this.proteinSequenceObj.setDNA(this);
		this.addProtein("Translation",this.proteinSequenceObj);
	}
	,setSequence: function(sequence) {
		saturn.core.DNA.prototype.setSequence.call(this,sequence);
		this.dnaSeq = sequence;
		if(this.proteinSequenceObj != null && this.dnaSeq != null && this.dnaSeq != "" && this.dnaSeq.length > 2) this.proteinSequenceObj.setSequence(this.getFrameTranslation(saturn.core.GeneticCodes.STANDARD,saturn.core.Frame.ONE));
	}
	,loadTranslation: function(cb) {
		this.proteinSequenceObj.setName(this.entryCloneId + " (Protein)");
		cb(this.proteinSequenceObj);
	}
	,__class__: saturn.core.domain.SgcEntryClone
});
saturn.core.domain.SgcForwardPrimer = $hxClasses["saturn.core.domain.SgcForwardPrimer"] = function() {
	saturn.core.DNA.call(this,null);
};
saturn.core.domain.SgcForwardPrimer.__name__ = ["saturn","core","domain","SgcForwardPrimer"];
saturn.core.domain.SgcForwardPrimer.__super__ = saturn.core.DNA;
saturn.core.domain.SgcForwardPrimer.prototype = $extend(saturn.core.DNA.prototype,{
	primerId: null
	,id: null
	,dnaSequence: null
	,targetId: null
	,setup: function() {
		this.setSequence(this.dnaSequence);
	}
	,getMoleculeName: function() {
		return this.primerId;
	}
	,setSequence: function(sequence) {
		saturn.core.DNA.prototype.setSequence.call(this,sequence);
		this.dnaSequence = sequence;
	}
	,__class__: saturn.core.domain.SgcForwardPrimer
});
saturn.core.domain.SgcReversePrimer = $hxClasses["saturn.core.domain.SgcReversePrimer"] = function() {
	saturn.core.DNA.call(this,null);
};
saturn.core.domain.SgcReversePrimer.__name__ = ["saturn","core","domain","SgcReversePrimer"];
saturn.core.domain.SgcReversePrimer.__super__ = saturn.core.DNA;
saturn.core.domain.SgcReversePrimer.prototype = $extend(saturn.core.DNA.prototype,{
	primerId: null
	,id: null
	,dnaSequence: null
	,targetId: null
	,setup: function() {
		this.setSequence(this.dnaSequence);
	}
	,getMoleculeName: function() {
		return this.primerId;
	}
	,setSequence: function(sequence) {
		saturn.core.DNA.prototype.setSequence.call(this,sequence);
		this.dnaSequence = sequence;
	}
	,__class__: saturn.core.domain.SgcReversePrimer
});
saturn.core.domain.SgcTarget = $hxClasses["saturn.core.domain.SgcTarget"] = function() {
	saturn.core.DNA.call(this,null);
	this.setup();
};
saturn.core.domain.SgcTarget.__name__ = ["saturn","core","domain","SgcTarget"];
saturn.core.domain.SgcTarget.__super__ = saturn.core.DNA;
saturn.core.domain.SgcTarget.prototype = $extend(saturn.core.DNA.prototype,{
	targetId: null
	,id: null
	,gi: null
	,dnaSeq: null
	,proteinSeq: null
	,geneId: null
	,activeStatus: null
	,pi: null
	,comments: null
	,proteinSequenceObj: null
	,complexComments: null
	,eln: null
	,complex: null
	,setup: function() {
		this.setSequence(this.dnaSeq);
		this.setName(this.targetId);
		this.sequenceField = "dnaSeq";
		if(this.proteinSequenceObj == null) this.proteinSequenceObj = new saturn.core.Protein(null);
		this.addProtein("Translation",this.proteinSequenceObj);
	}
	,proteinSequenceUpdated: function(sequence) {
		this.proteinSeq = sequence;
	}
	,setSequence: function(sequence) {
		saturn.core.DNA.prototype.setSequence.call(this,sequence);
		this.dnaSeq = sequence;
	}
	,loadWonka: function() {
	}
	,__class__: saturn.core.domain.SgcTarget
});
saturn.core.molecule.MoleculeFloatAttribute = $hxClasses["saturn.core.molecule.MoleculeFloatAttribute"] = { __ename__ : ["saturn","core","molecule","MoleculeFloatAttribute"], __constructs__ : ["MW","MW_CONDESATION"] };
saturn.core.molecule.MoleculeFloatAttribute.MW = ["MW",0];
saturn.core.molecule.MoleculeFloatAttribute.MW.toString = $estr;
saturn.core.molecule.MoleculeFloatAttribute.MW.__enum__ = saturn.core.molecule.MoleculeFloatAttribute;
saturn.core.molecule.MoleculeFloatAttribute.MW_CONDESATION = ["MW_CONDESATION",1];
saturn.core.molecule.MoleculeFloatAttribute.MW_CONDESATION.toString = $estr;
saturn.core.molecule.MoleculeFloatAttribute.MW_CONDESATION.__enum__ = saturn.core.molecule.MoleculeFloatAttribute;
saturn.core.molecule.MoleculeStringAttribute = $hxClasses["saturn.core.molecule.MoleculeStringAttribute"] = { __ename__ : ["saturn","core","molecule","MoleculeStringAttribute"], __constructs__ : ["NAME"] };
saturn.core.molecule.MoleculeStringAttribute.NAME = ["NAME",0];
saturn.core.molecule.MoleculeStringAttribute.NAME.toString = $estr;
saturn.core.molecule.MoleculeStringAttribute.NAME.__enum__ = saturn.core.molecule.MoleculeStringAttribute;
saturn.core.molecule.MoleculeAlignMode = $hxClasses["saturn.core.molecule.MoleculeAlignMode"] = { __ename__ : ["saturn","core","molecule","MoleculeAlignMode"], __constructs__ : ["REGEX","SIMPLE"] };
saturn.core.molecule.MoleculeAlignMode.REGEX = ["REGEX",0];
saturn.core.molecule.MoleculeAlignMode.REGEX.toString = $estr;
saturn.core.molecule.MoleculeAlignMode.REGEX.__enum__ = saturn.core.molecule.MoleculeAlignMode;
saturn.core.molecule.MoleculeAlignMode.SIMPLE = ["SIMPLE",1];
saturn.core.molecule.MoleculeAlignMode.SIMPLE.toString = $estr;
saturn.core.molecule.MoleculeAlignMode.SIMPLE.__enum__ = saturn.core.molecule.MoleculeAlignMode;
saturn.core.molecule.MoleculeConstants = $hxClasses["saturn.core.molecule.MoleculeConstants"] = function() { };
saturn.core.molecule.MoleculeConstants.__name__ = ["saturn","core","molecule","MoleculeConstants"];
saturn.core.molecule.MoleculeSets = $hxClasses["saturn.core.molecule.MoleculeSets"] = { __ename__ : ["saturn","core","molecule","MoleculeSets"], __constructs__ : ["STANDARD"] };
saturn.core.molecule.MoleculeSets.STANDARD = ["STANDARD",0];
saturn.core.molecule.MoleculeSets.STANDARD.toString = $estr;
saturn.core.molecule.MoleculeSets.STANDARD.__enum__ = saturn.core.molecule.MoleculeSets;
saturn.core.molecule.MoleculeSetRegistry = $hxClasses["saturn.core.molecule.MoleculeSetRegistry"] = function() {
	this.moleculeSets = new haxe.ds.StringMap();
	this.register(saturn.core.molecule.MoleculeSets.STANDARD,new saturn.core.StandardMoleculeSet());
};
saturn.core.molecule.MoleculeSetRegistry.__name__ = ["saturn","core","molecule","MoleculeSetRegistry"];
saturn.core.molecule.MoleculeSetRegistry.getStandardMoleculeSet = function() {
	return saturn.core.molecule.MoleculeSetRegistry.defaultRegistry.get(saturn.core.molecule.MoleculeSets.STANDARD);
};
saturn.core.molecule.MoleculeSetRegistry.prototype = {
	moleculeSets: null
	,register: function(setType,set) {
		this.registerSet(Std.string(setType),set);
	}
	,get: function(setType) {
		return this.getSet(Std.string(setType));
	}
	,registerSet: function(name,set) {
		this.moleculeSets.set(name,set);
	}
	,getSet: function(name) {
		return this.moleculeSets.get(name);
	}
	,__class__: saturn.core.molecule.MoleculeSetRegistry
};
if(!saturn.core.parsers) saturn.core.parsers = {};
saturn.core.parsers.BaseParser = $hxClasses["saturn.core.parsers.BaseParser"] = function(path,handler,done) {
	this.lineCount = 0;
	var _g = this;
	saturn.core.Generator.call(this,-1);
	this.doneCB = done;
	this.path = path;
	this.setMaxAtOnce(200);
	this.onEnd(done);
	this.onNext(function(objs,next,c) {
		handler(objs,_g);
	});
	if(path != null) this.read();
};
saturn.core.parsers.BaseParser.__name__ = ["saturn","core","parsers","BaseParser"];
saturn.core.parsers.BaseParser.__super__ = saturn.core.Generator;
saturn.core.parsers.BaseParser.prototype = $extend(saturn.core.Generator.prototype,{
	doneCB: null
	,path: null
	,content: null
	,lineCount: null
	,setContent: function(content) {
		this.content = content;
		this.read();
	}
	,read: function() {
		var _g = this;
		if(this.path != null) saturn.core.Util.open(this.path,function(err,line) {
			if(err != null) _g.die("Error reading file"); else {
				_g.lineCount++;
				if(line == null) {
					saturn.core.Util.debug("Lines read: " + _g.lineCount);
					_g.finished();
				} else {
					var obj = _g.parseLine(line);
					if(obj != null) _g.push(obj);
				}
			}
		}); else if(this.content != null) {
			var lines = this.content.split("\n");
			var _g1 = 0;
			while(_g1 < lines.length) {
				var line1 = lines[_g1];
				++_g1;
				var obj1 = this.parseLine(line1);
				if(obj1 != null) this.push(obj1);
			}
			this.finished();
		}
	}
	,parseLine: function(line) {
		return null;
	}
	,__class__: saturn.core.parsers.BaseParser
});
if(!saturn.db) saturn.db = {};
saturn.db.BatchFetch = $hxClasses["saturn.db.BatchFetch"] = function(onError) {
	this.items = new haxe.ds.StringMap();
	this.fetchList = [];
	this.retrieved = new haxe.ds.StringMap();
	this.position = 0;
	this.onError = onError;
};
saturn.db.BatchFetch.__name__ = ["saturn","db","BatchFetch"];
saturn.db.BatchFetch.prototype = {
	fetchList: null
	,userOnError: null
	,userOnComplete: null
	,position: null
	,retrieved: null
	,onComplete: null
	,onError: null
	,provider: null
	,items: null
	,onFinish: function(cb) {
		this.onComplete = cb;
	}
	,getById: function(objectId,clazz,key,callBack) {
		var list = [];
		list.push(objectId);
		return this.getByIds(list,clazz,key,callBack);
	}
	,getByIds: function(objectIds,clazz,key,callBack) {
		var work = new haxe.ds.StringMap();
		if(__map_reserved.IDS != null) work.setReserved("IDS",objectIds); else work.h["IDS"] = objectIds;
		if(__map_reserved.CLASS != null) work.setReserved("CLASS",clazz); else work.h["CLASS"] = clazz;
		if(__map_reserved.TYPE != null) work.setReserved("TYPE","getByIds"); else work.h["TYPE"] = "getByIds";
		if(__map_reserved.KEY != null) work.setReserved("KEY",key); else work.h["KEY"] = key;
		var value = callBack;
		work.set("CALLBACK",value);
		this.fetchList.push(work);
		return this;
	}
	,getByValue: function(value,clazz,field,key,callBack) {
		var list = [];
		list.push(value);
		return this.getByValues(list,clazz,field,key,callBack);
	}
	,getByValues: function(values,clazz,field,key,callBack) {
		var work = new haxe.ds.StringMap();
		if(__map_reserved.VALUES != null) work.setReserved("VALUES",values); else work.h["VALUES"] = values;
		if(__map_reserved.CLASS != null) work.setReserved("CLASS",clazz); else work.h["CLASS"] = clazz;
		if(__map_reserved.FIELD != null) work.setReserved("FIELD",field); else work.h["FIELD"] = field;
		if(__map_reserved.TYPE != null) work.setReserved("TYPE","getByValues"); else work.h["TYPE"] = "getByValues";
		if(__map_reserved.KEY != null) work.setReserved("KEY",key); else work.h["KEY"] = key;
		var value = callBack;
		work.set("CALLBACK",value);
		this.fetchList.push(work);
		return this;
	}
	,getByPkey: function(objectId,clazz,key,callBack) {
		var list = [];
		list.push(objectId);
		return this.getByPkeys(list,clazz,key,callBack);
	}
	,getByPkeys: function(objectIds,clazz,key,callBack) {
		var work = new haxe.ds.StringMap();
		if(__map_reserved.IDS != null) work.setReserved("IDS",objectIds); else work.h["IDS"] = objectIds;
		if(__map_reserved.CLASS != null) work.setReserved("CLASS",clazz); else work.h["CLASS"] = clazz;
		if(__map_reserved.TYPE != null) work.setReserved("TYPE","getByPkeys"); else work.h["TYPE"] = "getByPkeys";
		if(__map_reserved.KEY != null) work.setReserved("KEY",key); else work.h["KEY"] = key;
		var value = callBack;
		work.set("CALLBACK",value);
		this.fetchList.push(work);
		return this;
	}
	,append: function(val,field,clazz,cb) {
		var key = Type.getClassName(clazz) + "." + field;
		if(!this.items.exists(key)) {
			var value = [];
			this.items.set(key,value);
		}
		this.items.get(key).push({ val : val, field : field, clazz : clazz, cb : cb});
	}
	,next: function() {
		this.execute();
	}
	,setProvider: function(provider) {
		this.provider = provider;
	}
	,execute: function(cb) {
		var _g = this;
		var provider = this.provider;
		if(provider == null) provider = saturn.client.core.CommonCore.getDefaultProvider();
		if(cb != null) this.onFinish(cb);
		var $it0 = this.items.keys();
		while( $it0.hasNext() ) {
			var key = $it0.next();
			var units = this.items.get(key);
			var work1 = new haxe.ds.StringMap();
			if(__map_reserved.TYPE != null) work1.setReserved("TYPE","FETCHITEM"); else work1.h["TYPE"] = "FETCHITEM";
			work1.set("FIELD",units[0].field);
			work1.set("CLASS",units[0].clazz);
			if(__map_reserved.ITEMS != null) work1.setReserved("ITEMS",units); else work1.h["ITEMS"] = units;
			this.items.remove(key);
			this.fetchList.push(work1);
		}
		if(this.position == this.fetchList.length) {
			this.onComplete();
			return;
		}
		var work = this.fetchList[this.position];
		var type;
		type = __map_reserved.TYPE != null?work.getReserved("TYPE"):work.h["TYPE"];
		this.position++;
		if(type == "getByIds") provider.getByIds(__map_reserved.IDS != null?work.getReserved("IDS"):work.h["IDS"],__map_reserved.CLASS != null?work.getReserved("CLASS"):work.h["CLASS"],function(objs,exception) {
			if(exception != null || objs == null) _g.onError(objs,exception); else {
				var key1;
				key1 = __map_reserved.KEY != null?work.getReserved("KEY"):work.h["KEY"];
				_g.retrieved.set(key1,objs);
				var userCallBack;
				userCallBack = __map_reserved.CALLBACK != null?work.getReserved("CALLBACK"):work.h["CALLBACK"];
				if(userCallBack != null) userCallBack(objs,exception); else if(_g.position == _g.fetchList.length) _g.onComplete(); else _g.execute();
			}
		}); else if(type == "getByValues") provider.getByValues(__map_reserved.VALUES != null?work.getReserved("VALUES"):work.h["VALUES"],__map_reserved.CLASS != null?work.getReserved("CLASS"):work.h["CLASS"],__map_reserved.FIELD != null?work.getReserved("FIELD"):work.h["FIELD"],function(objs1,exception1) {
			if(exception1 != null || objs1 == null) _g.onError(objs1,exception1); else {
				var key2;
				key2 = __map_reserved.KEY != null?work.getReserved("KEY"):work.h["KEY"];
				_g.retrieved.set(key2,objs1);
				var userCallBack1;
				userCallBack1 = __map_reserved.CALLBACK != null?work.getReserved("CALLBACK"):work.h["CALLBACK"];
				if(userCallBack1 != null) userCallBack1(objs1,exception1); else if(_g.position == _g.fetchList.length) _g.onComplete(); else _g.execute();
			}
		}); else if(type == "getByPkeys") provider.getByPkeys(__map_reserved.IDS != null?work.getReserved("IDS"):work.h["IDS"],__map_reserved.CLASS != null?work.getReserved("CLASS"):work.h["CLASS"],function(obj,exception2) {
			if(exception2 != null || obj == null) _g.onError(obj,exception2); else {
				var key3;
				key3 = __map_reserved.KEY != null?work.getReserved("KEY"):work.h["KEY"];
				_g.retrieved.set(key3,obj);
				var userCallBack2;
				userCallBack2 = __map_reserved.CALLBACK != null?work.getReserved("CALLBACK"):work.h["CALLBACK"];
				if(userCallBack2 != null) userCallBack2(obj,exception2); else if(_g.position == _g.fetchList.length) _g.onComplete(); else _g.execute();
			}
		}); else if(type == "FETCHITEM") {
			var items;
			items = __map_reserved.ITEMS != null?work.getReserved("ITEMS"):work.h["ITEMS"];
			var itemMap = new haxe.ds.StringMap();
			var _g1 = 0;
			while(_g1 < items.length) {
				var item = items[_g1];
				++_g1;
				if(!itemMap.exists(item.val)) {
					var value = [];
					itemMap.set(item.val,value);
				}
				itemMap.get(item.val).push(item.cb);
			}
			var values = [];
			var $it1 = itemMap.keys();
			while( $it1.hasNext() ) {
				var key4 = $it1.next();
				values.push(key4);
			}
			var field;
			field = __map_reserved.FIELD != null?work.getReserved("FIELD"):work.h["FIELD"];
			provider.getByValues(values,__map_reserved.CLASS != null?work.getReserved("CLASS"):work.h["CLASS"],field,function(objs2,exception3) {
				if(exception3 != null || objs2 == null) _g.onError(objs2,exception3); else {
					var _g2 = 0;
					while(_g2 < objs2.length) {
						var obj1 = objs2[_g2];
						++_g2;
						var fieldValue = Reflect.field(obj1,field);
						if(__map_reserved[fieldValue] != null?itemMap.existsReserved(fieldValue):itemMap.h.hasOwnProperty(fieldValue)) {
							var _g11 = 0;
							var _g21;
							_g21 = __map_reserved[fieldValue] != null?itemMap.getReserved(fieldValue):itemMap.h[fieldValue];
							while(_g11 < _g21.length) {
								var cb1 = _g21[_g11];
								++_g11;
								cb1(obj1);
							}
						}
					}
					if(_g.position == _g.fetchList.length) _g.onComplete(); else _g.execute();
				}
			});
		}
	}
	,getObject: function(key) {
		return this.retrieved.get(key);
	}
	,__class__: saturn.db.BatchFetch
};
saturn.db.Connection = $hxClasses["saturn.db.Connection"] = function() { };
saturn.db.Connection.__name__ = ["saturn","db","Connection"];
saturn.db.Connection.prototype = {
	execute: null
	,close: null
	,commit: null
	,setAutoCommit: null
	,__class__: saturn.db.Connection
};
saturn.db.Provider = $hxClasses["saturn.db.Provider"] = function() { };
saturn.db.Provider.__name__ = ["saturn","db","Provider"];
saturn.db.Provider.prototype = {
	getById: null
	,getByIds: null
	,getByPkey: null
	,getByPkeys: null
	,getByIdStartsWith: null
	,update: null
	,insert: null
	,'delete': null
	,generateQualifiedName: null
	,updateObjects: null
	,insertObjects: null
	,insertOrUpdate: null
	,rollback: null
	,commit: null
	,isAttached: null
	,sql: null
	,getByNamedQuery: null
	,getObjectFromCache: null
	,activate: null
	,getModel: null
	,getObjectModel: null
	,save: null
	,modelToReal: null
	,attach: null
	,resetCache: null
	,evictNamedQuery: null
	,readModels: null
	,dataBinding: null
	,isDataBinding: null
	,setSelectClause: null
	,_update: null
	,_insert: null
	,_delete: null
	,getByValue: null
	,getByValues: null
	,getObjects: null
	,queryPath: null
	,getModels: null
	,getModelClasses: null
	,connectAsUser: null
	,setConnectAsUser: null
	,enableCache: null
	,generatedLinkedClone: null
	,setUser: null
	,getUser: null
	,closeConnection: null
	,_closeConnection: null
	,setAutoCommit: null
	,setName: null
	,getName: null
	,getConfig: null
	,setConfig: null
	,evictObject: null
	,getByExample: null
	,query: null
	,getQuery: null
	,getProviderType: null
	,getModelByStringName: null
	,getConnection: null
	,uploadFile: null
	,addHook: null
	,__class__: saturn.db.Provider
};
saturn.db.DefaultProvider = $hxClasses["saturn.db.DefaultProvider"] = function(binding_map,config,autoClose) {
	this.user = null;
	this.namedQueryHookConfigs = new haxe.ds.StringMap();
	this.namedQueryHooks = new haxe.ds.StringMap();
	this.connectWithUserCreds = false;
	this.enableBinding = true;
	this.useCache = true;
	this.setPlatform();
	if(binding_map != null) this.setModels(binding_map);
	this.config = config;
	this.autoClose = autoClose;
	this.namedQueryHooks = new haxe.ds.StringMap();
	if(config != null && Object.prototype.hasOwnProperty.call(config,"named_query_hooks")) this.addHooks(Reflect.field(config,"named_query_hooks"));
	var $it0 = this.namedQueryHooks.keys();
	while( $it0.hasNext() ) {
		var hook = $it0.next();
		saturn.core.Util.debug("Installed hook: " + hook + "/" + Std.string(this.namedQueryHooks.get(hook)));
	}
};
saturn.db.DefaultProvider.__name__ = ["saturn","db","DefaultProvider"];
saturn.db.DefaultProvider.__interfaces__ = [saturn.db.Provider];
saturn.db.DefaultProvider.prototype = {
	theBindingMap: null
	,fieldIndexMap: null
	,objectCache: null
	,namedQueryCache: null
	,useCache: null
	,enableBinding: null
	,connectWithUserCreds: null
	,namedQueryHooks: null
	,namedQueryHookConfigs: null
	,modelClasses: null
	,user: null
	,autoClose: null
	,name: null
	,config: null
	,winConversions: null
	,linConversions: null
	,conversions: null
	,regexs: null
	,platform: null
	,setPlatform: function() {
		null;
		return;
	}
	,generateQualifiedName: function(schemaName,tableName) {
		return null;
	}
	,getConfig: function() {
		return this.config;
	}
	,setConfig: function(config) {
		this.config = config;
	}
	,setName: function(name) {
		this.name = name;
	}
	,getName: function() {
		return this.name;
	}
	,setUser: function(user) {
		this.user = user;
		this._closeConnection();
	}
	,getUser: function() {
		return this.user;
	}
	,closeConnection: function(connection) {
		if(this.autoClose) this._closeConnection();
	}
	,_closeConnection: function() {
	}
	,generatedLinkedClone: function() {
		var clazz = js.Boot.getClass(this);
		var provider = Type.createEmptyInstance(clazz);
		provider.theBindingMap = this.theBindingMap;
		provider.fieldIndexMap = this.fieldIndexMap;
		provider.namedQueryCache = this.namedQueryCache;
		provider.useCache = this.useCache;
		provider.enableBinding = this.enableBinding;
		provider.connectWithUserCreds = this.connectWithUserCreds;
		provider.namedQueryHooks = this.namedQueryHooks;
		provider.modelClasses = this.modelClasses;
		provider.platform = this.platform;
		provider.linConversions = this.linConversions;
		provider.winConversions = this.winConversions;
		provider.conversions = this.conversions;
		provider.regexs = this.regexs;
		provider.namedQueryHookConfigs = this.namedQueryHookConfigs;
		provider.config = this.config;
		provider.objectCache = new haxe.ds.StringMap();
		return provider;
	}
	,enableCache: function(cached) {
		this.useCache = cached;
	}
	,connectAsUser: function() {
		return this.connectWithUserCreds;
	}
	,setConnectAsUser: function(asUser) {
		this.connectWithUserCreds = asUser;
	}
	,setModels: function(binding_map) {
		this.theBindingMap = binding_map;
		var $it0 = binding_map.keys();
		while( $it0.hasNext() ) {
			var clazz = $it0.next();
			if((function($this) {
				var $r;
				var this1;
				this1 = __map_reserved[clazz] != null?binding_map.getReserved(clazz):binding_map.h[clazz];
				$r = this1.exists("polymorphic");
				return $r;
			}(this))) {
				if(!(function($this) {
					var $r;
					var this2;
					this2 = __map_reserved[clazz] != null?binding_map.getReserved(clazz):binding_map.h[clazz];
					$r = this2.exists("fields.synthetic");
					return $r;
				}(this))) {
					var this3;
					this3 = __map_reserved[clazz] != null?binding_map.getReserved(clazz):binding_map.h[clazz];
					var value = new haxe.ds.StringMap();
					this3.set("fields.synthetic",value);
				}
				var d;
				var this4;
				this4 = __map_reserved[clazz] != null?binding_map.getReserved(clazz):binding_map.h[clazz];
				d = this4.get("fields.synthetic");
				d.set("polymorphic",(function($this) {
					var $r;
					var this5;
					this5 = __map_reserved[clazz] != null?binding_map.getReserved(clazz):binding_map.h[clazz];
					$r = this5.get("polymorphic");
					return $r;
				}(this)));
			}
		}
		this.initModelClasses();
		this.resetCache();
	}
	,readModels: function(cb) {
	}
	,postConfigureModels: function() {
		var $it0 = this.theBindingMap.keys();
		while( $it0.hasNext() ) {
			var class_name = $it0.next();
			var d = this.theBindingMap.get(class_name);
			var value = this.getName();
			d.set("provider_name",value);
			saturn.core.Util.debug(class_name + " on " + this.getName());
		}
		if(this.isModel(saturn.core.domain.FileProxy)) {
			var this1 = this.getModel(saturn.core.domain.FileProxy).getOptions();
			this.winConversions = this1.get("windows_conversions");
			var this2 = this.getModel(saturn.core.domain.FileProxy).getOptions();
			this.linConversions = this2.get("linux_conversions");
			if(this.platform == "windows") {
				this.conversions = this.winConversions;
				var this3 = this.getModel(saturn.core.domain.FileProxy).getOptions();
				this.regexs = this3.get("windows_allowed_paths_regex");
			} else if(this.platform == "linux") {
				this.conversions = this.linConversions;
				var this4 = this.getModel(saturn.core.domain.FileProxy).getOptions();
				this.regexs = this4.get("linux_allowed_paths_regex");
			}
			if(this.regexs != null) {
				var $it1 = this.regexs.keys();
				while( $it1.hasNext() ) {
					var key = $it1.next();
					var s;
					s = js.Boot.__cast(this.regexs.get(key) , String);
					var value1 = new EReg(s,"");
					this.regexs.set(key,value1);
				}
			}
		}
	}
	,getModels: function() {
		return this.theBindingMap;
	}
	,resetCache: function() {
		this.objectCache = new haxe.ds.StringMap();
		if(this.theBindingMap != null) {
			var $it0 = this.theBindingMap.keys();
			while( $it0.hasNext() ) {
				var className = $it0.next();
				var this1 = this.theBindingMap.get(className);
				var value = new haxe.ds.StringMap();
				this1.set("statements",value);
				var value1 = new haxe.ds.StringMap();
				this.objectCache.set(className,value1);
				if((function($this) {
					var $r;
					var this2 = $this.theBindingMap.get(className);
					$r = this2.exists("indexes");
					return $r;
				}(this))) {
					var $it1 = (function($this) {
						var $r;
						var this3;
						{
							var this4 = $this.theBindingMap.get(className);
							this3 = this4.get("indexes");
						}
						$r = this3.keys();
						return $r;
					}(this));
					while( $it1.hasNext() ) {
						var field = $it1.next();
						var this5 = this.objectCache.get(className);
						var value2 = new haxe.ds.StringMap();
						this5.set(field,value2);
					}
				}
			}
		}
		this.namedQueryCache = new haxe.ds.StringMap();
	}
	,getObjectFromCache: function(clazz,field,val) {
		var className = Type.getClassName(clazz);
		if(this.objectCache.exists(className)) {
			if((function($this) {
				var $r;
				var this1 = $this.objectCache.get(className);
				$r = this1.exists(field);
				return $r;
			}(this))) {
				if((function($this) {
					var $r;
					var this2;
					{
						var this3 = $this.objectCache.get(className);
						this2 = this3.get(field);
					}
					var key = val;
					$r = this2.exists(key);
					return $r;
				}(this))) {
					var this4;
					var this5 = this.objectCache.get(className);
					this4 = this5.get(field);
					var key1 = val;
					return this4.get(key1);
				} else return null;
			} else return null;
		} else return null;
	}
	,initialiseObjects: function(idsToFetch,toBind,prefetched,exception,callBack,clazz,bindField,cache,allowAutoBind) {
		if(allowAutoBind == null) allowAutoBind = true;
		if(idsToFetch.length > 0 && toBind == null || clazz == null || toBind != null && toBind.length > 0 && clazz != null && js.Boot.__instanceof(toBind[0],clazz)) callBack(toBind,exception); else {
			var model = this.getModel(clazz);
			if(model == null) {
				var boundObjs1 = [];
				var _g = 0;
				while(_g < toBind.length) {
					var item = toBind[_g];
					++_g;
					var obj = Type.createInstance(clazz,[]);
					var _g1 = 0;
					var _g2 = Type.getInstanceFields(clazz);
					while(_g1 < _g2.length) {
						var field = _g2[_g1];
						++_g1;
						if(Object.prototype.hasOwnProperty.call(item,field)) Reflect.setField(obj,field,Reflect.field(item,field));
					}
					boundObjs1.push(obj);
				}
				callBack(boundObjs1,exception);
				return;
			}
			var autoActivate = model.getAutoActivateLevel();
			var surpressSetup = false;
			if(autoActivate != -1 && this.enableBinding && allowAutoBind) surpressSetup = true;
			var boundObjs = [];
			if(toBind != null) {
				var _g3 = 0;
				while(_g3 < toBind.length) {
					var obj1 = toBind[_g3];
					++_g3;
					boundObjs.push(this.bindObject(obj1,clazz,cache,bindField,surpressSetup));
				}
			}
			if(autoActivate != -1 && this.enableBinding && allowAutoBind) this.activate(boundObjs,autoActivate,function(err) {
				if(err == null) {
					var _g4 = 0;
					while(_g4 < boundObjs.length) {
						var boundObj = boundObjs[_g4];
						++_g4;
						if(Reflect.isFunction(boundObj.setup)) boundObj.setup();
					}
					if(prefetched != null) {
						var _g5 = 0;
						while(_g5 < prefetched.length) {
							var obj2 = prefetched[_g5];
							++_g5;
							boundObjs.push(obj2);
						}
					}
					callBack(boundObjs,exception);
				} else callBack(null,err);
			}); else {
				if(prefetched != null) {
					var _g6 = 0;
					while(_g6 < prefetched.length) {
						var obj3 = prefetched[_g6];
						++_g6;
						boundObjs.push(obj3);
					}
				}
				callBack(boundObjs,exception);
			}
		}
	}
	,getById: function(id,clazz,callBack) {
		this.getByIds([id],clazz,function(objs,exception) {
			if(objs != null) callBack(objs[0],exception); else callBack(null,exception);
		});
	}
	,getByIds: function(ids,clazz,callBack) {
		var _g = this;
		var prefetched = null;
		var idsToFetch = null;
		if(this.useCache) {
			var model = this.getModel(clazz);
			if(model != null) {
				var firstKey = model.getFirstKey();
				prefetched = [];
				idsToFetch = [];
				var _g1 = 0;
				while(_g1 < ids.length) {
					var id = ids[_g1];
					++_g1;
					var cacheObject = this.getObjectFromCache(clazz,firstKey,id);
					if(cacheObject != null) prefetched.push(cacheObject); else idsToFetch.push(id);
				}
			} else idsToFetch = ids;
		} else idsToFetch = ids;
		if(idsToFetch.length > 0) this._getByIds(idsToFetch,clazz,function(toBind,exception) {
			_g.initialiseObjects(idsToFetch,toBind,prefetched,exception,callBack,clazz,null,true);
		}); else callBack(prefetched,null);
	}
	,_getByIds: function(ids,clazz,callBack) {
	}
	,getByExample: function(obj,cb) {
		var q = this.getQuery();
		q.addExample(obj);
		q.run(cb);
		return q;
	}
	,query: function(query,cb) {
		var _g = this;
		this._query(query,function(objs,err) {
			if(_g.isDataBinding()) {
				if(err == null) {
					var clazzList = query.getSelectClassList();
					if(query.bindResults() && clazzList != null) {
						if(clazzList.length == 1) _g.initialiseObjects([],objs,[],err,cb,Type.resolveClass(clazzList[0]),null,true);
					} else cb(objs,err);
				} else cb(null,err);
			} else cb(objs,err);
		});
	}
	,_query: function(query,cb) {
	}
	,getByValue: function(value,clazz,field,callBack) {
		this.getByValues([value],clazz,field,function(objs,exception) {
			if(objs != null) callBack(objs[0],exception); else callBack(null,exception);
		});
	}
	,getByValues: function(ids,clazz,field,callBack) {
		var _g = this;
		var prefetched = null;
		var idsToFetch = null;
		saturn.core.Util.debug("Using cache " + Std.string(this.useCache));
		if(this.useCache) {
			saturn.core.Util.debug("Using cache " + Std.string(this.useCache));
			var model = this.getModel(clazz);
			if(model != null) {
				prefetched = [];
				idsToFetch = [];
				var _g1 = 0;
				while(_g1 < ids.length) {
					var id = ids[_g1];
					++_g1;
					var cacheObject = this.getObjectFromCache(clazz,field,id);
					if(cacheObject != null) {
						if((cacheObject instanceof Array) && cacheObject.__enum__ == null) {
							var objArray = cacheObject;
							var _g11 = 0;
							while(_g11 < objArray.length) {
								var obj = objArray[_g11];
								++_g11;
								prefetched.push(obj);
							}
						} else prefetched.push(cacheObject);
					} else idsToFetch.push(id);
				}
			} else idsToFetch = ids;
		} else idsToFetch = ids;
		if(idsToFetch.length > 0) this._getByValues(idsToFetch,clazz,field,function(toBind,exception) {
			_g.initialiseObjects(idsToFetch,toBind,prefetched,exception,callBack,clazz,field,true);
		}); else callBack(prefetched,null);
	}
	,_getByValues: function(values,clazz,field,callBack) {
	}
	,getObjects: function(clazz,callBack) {
		var _g = this;
		this._getObjects(clazz,function(toBind,exception) {
			if(exception != null) callBack(null,exception); else _g.initialiseObjects([],toBind,[],exception,callBack,clazz,null,true);
		});
	}
	,_getObjects: function(clazz,callBack) {
	}
	,getByPkey: function(id,clazz,callBack) {
		this.getByPkeys([id],clazz,function(objs,exception) {
			if(objs != null) callBack(objs[0],exception); else callBack(null,exception);
		});
	}
	,getByPkeys: function(ids,clazz,callBack) {
		var _g = this;
		var prefetched = null;
		var idsToFetch = null;
		if(this.useCache) {
			var model = this.getModel(clazz);
			if(model != null) {
				var priField = model.getPrimaryKey();
				prefetched = [];
				idsToFetch = [];
				var _g1 = 0;
				while(_g1 < ids.length) {
					var id = ids[_g1];
					++_g1;
					var cacheObject = this.getObjectFromCache(clazz,priField,id);
					if(cacheObject != null) prefetched.push(cacheObject); else idsToFetch.push(id);
				}
			} else idsToFetch = ids;
		} else idsToFetch = ids;
		if(idsToFetch.length > 0) this._getByPkeys(idsToFetch,clazz,function(toBind,exception) {
			_g.initialiseObjects(idsToFetch,toBind,prefetched,exception,callBack,clazz,null,true);
		}); else callBack(prefetched,null);
	}
	,_getByPkeys: function(ids,clazz,callBack) {
	}
	,getConnection: function(config,cb) {
	}
	,sql: function(sql,parameters,cb) {
		this.getByNamedQuery("saturn.db.provider.hooks.RawSQLHook:SQL",[sql,parameters],null,false,cb);
	}
	,getByNamedQuery: function(queryId,parameters,clazz,cache,callBack) {
		var _g = this;
		saturn.core.Util.debug("In getByNamedQuery " + (cache == null?"null":"" + cache));
		try {
			if(cache) {
				saturn.core.Util.debug("Looking for cached result");
				var queries = this.namedQueryCache.get(queryId);
				var serialParamString = haxe.Serializer.run(parameters);
				var crc1 = haxe.crypto.Md5.encode(queryId + "/" + serialParamString);
				if(this.namedQueryCache.exists(crc1)) {
					var qResults = this.namedQueryCache.get(crc1).queryResults;
					saturn.core.Util.debug("Use cached result");
					callBack(qResults,null);
					return;
				}
			}
			var privateCB = function(toBind,exception) {
				if(toBind == null) callBack(toBind,exception); else _g.initialiseObjects([],toBind,[],exception,function(objs,err) {
					if(_g.useCache) {
						saturn.core.Util.debug("Caching result");
						var namedQuery = new saturn.db.NamedQueryCache();
						namedQuery.queryName = queryId;
						namedQuery.queryParams = parameters;
						namedQuery.queryParamSerial = haxe.Serializer.run(parameters);
						namedQuery.queryResults = objs;
						var crc = haxe.crypto.Md5.encode(queryId + "/" + namedQuery.queryParamSerial);
						_g.namedQueryCache.set(crc,namedQuery);
					}
					callBack(objs,err);
				},clazz,null,cache);
			};
			if(queryId == "saturn.workflow") {
				var jobName = parameters[0];
				var config = parameters[1];
				saturn.core.Util.debug("Got workflow query " + jobName);
				saturn.core.Util.debug(Type.getClassName(config == null?null:js.Boot.getClass(config)));
				if(this.namedQueryHooks.exists(jobName)) this.namedQueryHooks.get(jobName)(config,function(object,error) {
					privateCB([object],object.getError());
				}); else {
					saturn.core.Util.debug("Unknown workflow query");
					this._getByNamedQuery(queryId,parameters,clazz,privateCB);
				}
			} else if(this.namedQueryHooks.exists(queryId)) {
				var config1 = null;
				if(this.namedQueryHookConfigs.exists(queryId)) config1 = this.namedQueryHookConfigs.get(queryId);
				saturn.core.Util.debug("Calling hook");
				this.namedQueryHooks.get(queryId)(queryId,parameters,clazz,privateCB,config1);
			} else this._getByNamedQuery(queryId,parameters,clazz,privateCB);
		} catch( ex ) {
			if (ex instanceof js._Boot.HaxeError) ex = ex.val;
			callBack(null,"An unexpected exception has occurred");
			saturn.core.Util.debug(ex);
		}
	}
	,addHooks: function(hooks) {
		var _g = 0;
		while(_g < hooks.length) {
			var hookdef = hooks[_g];
			++_g;
			var name = Reflect.field(hookdef,"name");
			var hook;
			if(Object.prototype.hasOwnProperty.call(hookdef,"func")) hook = Reflect.field(hookdef,"func"); else {
				var clazz = Reflect.field(hookdef,"class");
				var method = Reflect.field(hookdef,"method");
				hook = Reflect.field(Type.resolveClass(clazz),method);
			}
			this.namedQueryHooks.set(name,hook);
			var value = hookdef;
			this.namedQueryHookConfigs.set(name,value);
		}
	}
	,addHook: function(hook,name) {
		var value = hook;
		this.namedQueryHooks.set(name,value);
	}
	,_getByNamedQuery: function(queryId,parameters,clazz,callBack) {
	}
	,getByIdStartsWith: function(id,field,clazz,limit,callBack) {
		var _g = this;
		saturn.core.Util.debug("Starts with using cache " + Std.string(this.useCache));
		var queryId = "__STARTSWITH_" + Type.getClassName(clazz);
		var parameters = [];
		parameters.push(field);
		parameters.push(id);
		var crc = null;
		if(this.useCache) {
			var crc1 = haxe.crypto.Md5.encode(queryId + "/" + haxe.Serializer.run(parameters));
			if(this.namedQueryCache.exists(crc1)) {
				callBack(this.namedQueryCache.get(crc1).queryResults,null);
				return;
			}
		}
		this._getByIdStartsWith(id,field,clazz,limit,function(toBind,exception) {
			if(toBind == null) callBack(toBind,exception); else _g.initialiseObjects([],toBind,[],exception,function(objs,err) {
				if(_g.useCache) {
					var namedQuery = new saturn.db.NamedQueryCache();
					namedQuery.queryName = queryId;
					namedQuery.queryParams = parameters;
					namedQuery.queryResults = objs;
					_g.namedQueryCache.set(crc,namedQuery);
				}
				callBack(objs,err);
			},clazz,null,false,false);
		});
	}
	,_getByIdStartsWith: function(id,field,clazz,limit,callBack) {
	}
	,update: function(object,callBack) {
		this.synchronizeInternalLinks([object]);
		var className = Type.getClassName(Type.getClass(object));
		this.evictObject(object);
		var attributeMaps = [];
		attributeMaps.push(this.unbindObject(object));
		this._update(attributeMaps,className,callBack);
	}
	,insert: function(obj,cb) {
		var _g = this;
		this.synchronizeInternalLinks([obj]);
		var className = Type.getClassName(Type.getClass(obj));
		this.evictObject(obj);
		var attributeMaps = [];
		attributeMaps.push(this.unbindObject(obj));
		this._insert(attributeMaps,className,function(err) {
			if(err == null) _g.attach([obj],true,function(err1) {
				cb(err1);
			}); else cb(err);
		});
	}
	,'delete': function(obj,cb) {
		var _g = this;
		var className = Type.getClassName(Type.getClass(obj));
		var attributeMaps = [];
		attributeMaps.push(this.unbindObject(obj));
		this.evictObject(obj);
		this._delete(attributeMaps,className,function(err) {
			var model = _g.getModel(Type.getClass(obj));
			var field = model.getPrimaryKey();
			obj[field] = null;
			cb(err);
		});
	}
	,evictObject: function(object) {
		var clazz = Type.getClass(object);
		var className = Type.getClassName(clazz);
		if(this.objectCache.exists(className)) {
			var $it0 = (function($this) {
				var $r;
				var this1 = $this.objectCache.get(className);
				$r = this1.keys();
				return $r;
			}(this));
			while( $it0.hasNext() ) {
				var indexField = $it0.next();
				var val = Reflect.field(object,indexField);
				if(val != null && val != "") {
					if((function($this) {
						var $r;
						var this2;
						{
							var this3 = $this.objectCache.get(className);
							this2 = this3.get(indexField);
						}
						$r = this2.exists(val);
						return $r;
					}(this))) {
						var this4;
						var this5 = this.objectCache.get(className);
						this4 = this5.get(indexField);
						this4.remove(val);
					}
				}
			}
		}
	}
	,evictNamedQuery: function(queryId,parameters) {
		var crc = haxe.crypto.Md5.encode(queryId + "/" + haxe.Serializer.run(parameters));
		if(this.namedQueryCache.exists(crc)) this.namedQueryCache.remove(crc);
	}
	,updateObjects: function(objs,callBack) {
		this.synchronizeInternalLinks(objs);
		var className = Type.getClassName(Type.getClass(objs[0]));
		var attributeMaps = [];
		var _g = 0;
		while(_g < objs.length) {
			var object = objs[_g];
			++_g;
			this.evictObject(object);
			attributeMaps.push(this.unbindObject(object));
		}
		this._update(attributeMaps,className,callBack);
	}
	,insertObjects: function(objs,cb) {
		var _g1 = this;
		if(objs.length == 0) {
			cb(null);
			return;
		}
		this.synchronizeInternalLinks(objs);
		this.attach(objs,false,function(err) {
			if(err != null) cb(err); else {
				var className = Type.getClassName(Type.getClass(objs[0]));
				var attributeMaps = [];
				var _g = 0;
				while(_g < objs.length) {
					var object = objs[_g];
					++_g;
					_g1.evictObject(object);
					attributeMaps.push(_g1.unbindObject(object));
				}
				_g1._insert(attributeMaps,className,function(err1) {
					cb(err1);
				});
			}
		});
	}
	,rollback: function(callBack) {
		this._rollback(callBack);
	}
	,commit: function(callBack) {
		this._commit(callBack);
	}
	,_update: function(attributeMaps,className,callBack) {
	}
	,_insert: function(attributeMaps,className,callBack) {
	}
	,_delete: function(attributeMaps,className,callBack) {
	}
	,_rollback: function(callBack) {
	}
	,_commit: function(cb) {
		cb("Commit not supported");
	}
	,bindObject: function(attributeMap,clazz,cache,indexField,suspendSetup) {
		if(suspendSetup == null) suspendSetup = false;
		if(clazz == null) {
			var _g = 0;
			var _g1 = Reflect.fields(attributeMap);
			while(_g < _g1.length) {
				var key = _g1[_g];
				++_g;
				var val = Reflect.field(attributeMap,key);
				if(saturn.db.DefaultProvider.r_date.match(val)) Reflect.setField(attributeMap,key,new Date(Date.parse(val)));
			}
			return attributeMap;
		}
		if(this.enableBinding) {
			var className = Type.getClassName(clazz);
			var parts = className.split(".");
			var shortName = parts.pop();
			var packageName = parts.join(".");
			var obj = Type.createInstance(clazz,[]);
			if(this.theBindingMap.exists(className)) {
				var map;
				var this1 = this.theBindingMap.get(className);
				map = this1.get("fields");
				var indexes;
				var this2 = this.theBindingMap.get(className);
				indexes = this2.get("indexes");
				var atPriIndex = null;
				var $it0 = indexes.keys();
				while( $it0.hasNext() ) {
					var atIndexField = $it0.next();
					if((__map_reserved[atIndexField] != null?indexes.getReserved(atIndexField):indexes.h[atIndexField]) == 1) {
						atPriIndex = atIndexField;
						break;
					}
				}
				var colPriIndex = null;
				if(atPriIndex != null) colPriIndex = __map_reserved[atPriIndex] != null?map.getReserved(atPriIndex):map.h[atPriIndex];
				var priKeyValue = null;
				if(Reflect.hasField(attributeMap,colPriIndex)) priKeyValue = Reflect.field(attributeMap,colPriIndex); else if(Reflect.hasField(attributeMap,colPriIndex.toLowerCase())) priKeyValue = Reflect.field(attributeMap,colPriIndex.toLowerCase());
				var keys = [];
				var $it1 = map.keys();
				while( $it1.hasNext() ) {
					var key1 = $it1.next();
					keys.push(key1);
				}
				if(indexField != null && !(__map_reserved[indexField] != null?map.existsReserved(indexField):map.h.hasOwnProperty(indexField))) keys.push(indexField);
				var _g2 = 0;
				while(_g2 < keys.length) {
					var key2 = keys[_g2];
					++_g2;
					if(!(function($this) {
						var $r;
						var this3 = $this.objectCache.get(className);
						$r = this3.exists(key2);
						return $r;
					}(this))) {
						var this4 = this.objectCache.get(className);
						var value = new haxe.ds.StringMap();
						this4.set(key2,value);
					}
					var atKey;
					atKey = __map_reserved[key2] != null?map.getReserved(key2):map.h[key2];
					var val1 = null;
					if(Reflect.hasField(attributeMap,atKey)) val1 = Reflect.field(attributeMap,atKey); else if(Reflect.hasField(attributeMap,atKey.toLowerCase())) val1 = Reflect.field(attributeMap,atKey.toLowerCase());
					if(saturn.db.DefaultProvider.r_date.match(val1)) Reflect.setField(obj,key2,new Date(Date.parse(val))); else obj[key2] = val1;
					if(cache && indexes != null && ((__map_reserved[key2] != null?indexes.existsReserved(key2):indexes.h.hasOwnProperty(key2)) || key2 == indexField) && this.useCache) {
						if(priKeyValue != null) {
							if((function($this) {
								var $r;
								var this5;
								{
									var this6 = $this.objectCache.get(className);
									this5 = this6.get(key2);
								}
								$r = this5.exists(val1);
								return $r;
							}(this))) {
								var mappedObj;
								var this7;
								var this8 = this.objectCache.get(className);
								this7 = this8.get(key2);
								mappedObj = this7.get(val1);
								var toCheck = mappedObj;
								var isArray = (mappedObj instanceof Array) && mappedObj.__enum__ == null;
								if(!isArray) toCheck = [mappedObj];
								var match = false;
								var _g21 = 0;
								var _g11 = toCheck.length;
								while(_g21 < _g11) {
									var i = _g21++;
									var eObj = toCheck[i];
									var priValue = Reflect.field(eObj,atPriIndex);
									if(priValue == priKeyValue) {
										toCheck[i] = obj;
										match = true;
										break;
									}
								}
								if(match == false) toCheck.push(obj);
								if(toCheck.length == 1) {
									var this9;
									var this10 = this.objectCache.get(className);
									this9 = this10.get(key2);
									var value1 = toCheck[0];
									this9.set(val1,value1);
								} else {
									var this11;
									var this12 = this.objectCache.get(className);
									this11 = this12.get(key2);
									this11.set(val1,toCheck);
								}
								continue;
							}
						}
						var this13;
						var this14 = this.objectCache.get(className);
						this13 = this14.get(key2);
						this13.set(val1,obj);
					}
				}
			}
			if(!suspendSetup && Reflect.isFunction(obj.setup)) obj.setup();
			return obj;
		} else return attributeMap;
	}
	,unbindObject: function(object) {
		if(this.enableBinding) {
			var className = Type.getClassName(Type.getClass(object));
			var attributeMap = new haxe.ds.StringMap();
			if(this.theBindingMap.exists(className)) {
				var map;
				var this1 = this.theBindingMap.get(className);
				map = this1.get("fields");
				var $it0 = map.keys();
				while( $it0.hasNext() ) {
					var key = $it0.next();
					var val = Reflect.field(object,key);
					var key1;
					key1 = __map_reserved[key] != null?map.getReserved(key):map.h[key];
					if(__map_reserved[key1] != null) attributeMap.setReserved(key1,val); else attributeMap.h[key1] = val;
				}
				return attributeMap;
			} else return null;
		} else return object;
	}
	,activate: function(objects,depthLimit,callBack) {
		var _g = this;
		this._activate(objects,1,depthLimit,function(error) {
			if(error == null) _g.merge(objects);
			callBack(error);
		});
	}
	,_activate: function(objects,depth,depthLimit,callBack) {
		var _g1 = this;
		var objectsToFetch = 0;
		var batchQuery = new saturn.db.BatchFetch(function(obj,err) {
		});
		batchQuery.setProvider(this);
		var classToFetch = new haxe.ds.StringMap();
		var _g = 0;
		while(_g < objects.length) {
			var object = objects[_g];
			++_g;
			if(object == null || js.Boot.__instanceof(object,ArrayBuffer) || js.Boot.__instanceof(object,haxe.ds.StringMap)) continue;
			var clazz = Type.getClass(object);
			if(clazz == null) continue;
			var clazzName = Type.getClassName(clazz);
			if(this.theBindingMap.exists(clazzName)) {
				if((function($this) {
					var $r;
					var this1 = $this.theBindingMap.get(clazzName);
					$r = this1.exists("fields.synthetic");
					return $r;
				}(this))) {
					var synthFields;
					var this2 = this.theBindingMap.get(clazzName);
					synthFields = this2.get("fields.synthetic");
					var $it0 = synthFields.keys();
					while( $it0.hasNext() ) {
						var synthFieldName = $it0.next();
						var synthInfo;
						synthInfo = __map_reserved[synthFieldName] != null?synthFields.getReserved(synthFieldName):synthFields.h[synthFieldName];
						var fkField = synthInfo.get("fk_field");
						if(fkField == null) {
							Reflect.setField(object,synthFieldName,Type.createInstance(Type.resolveClass(synthInfo.get("class")),[Reflect.field(object,synthInfo.get("field"))]));
							continue;
						}
						var synthVal = Reflect.field(object,synthFieldName);
						if(synthVal != null) continue;
						var isPolymorphic = synthInfo.exists("selector_field");
						var synthClass;
						if(isPolymorphic) {
							var selectorField = synthInfo.get("selector_field");
							var objValue = Reflect.field(object,selectorField);
							if(synthInfo.get("selector_values").exists(objValue)) synthClass = synthInfo.get("selector_values").get(objValue); else continue;
							var selectorValue = synthInfo.get("selector_value");
							synthFieldName = "_MERGE";
						} else synthClass = synthInfo.get("class");
						var field = synthInfo.get("field");
						var val = Reflect.field(object,field);
						if(val == null || val == "" && !((val | 0) === val)) object[synthFieldName] = null; else {
							var cacheObj = this.getObjectFromCache(Type.resolveClass(synthClass),fkField,val);
							if(cacheObj == null) {
								objectsToFetch++;
								if(!(__map_reserved[synthClass] != null?classToFetch.existsReserved(synthClass):classToFetch.h.hasOwnProperty(synthClass))) {
									var value = new haxe.ds.StringMap();
									if(__map_reserved[synthClass] != null) classToFetch.setReserved(synthClass,value); else classToFetch.h[synthClass] = value;
								}
								if(!(function($this) {
									var $r;
									var this3;
									this3 = __map_reserved[synthClass] != null?classToFetch.getReserved(synthClass):classToFetch.h[synthClass];
									$r = this3.exists(fkField);
									return $r;
								}(this))) {
									var this4;
									this4 = __map_reserved[synthClass] != null?classToFetch.getReserved(synthClass):classToFetch.h[synthClass];
									var value1 = new haxe.ds.StringMap();
									this4.set(fkField,value1);
								}
								var this5;
								var this6;
								this6 = __map_reserved[synthClass] != null?classToFetch.getReserved(synthClass):classToFetch.h[synthClass];
								this5 = this6.get(fkField);
								this5.set(val,"");
							} else object[synthFieldName] = cacheObj;
						}
					}
				}
			}
		}
		var $it1 = classToFetch.keys();
		while( $it1.hasNext() ) {
			var synthClass1 = $it1.next();
			var $it2 = (function($this) {
				var $r;
				var this7;
				this7 = __map_reserved[synthClass1] != null?classToFetch.getReserved(synthClass1):classToFetch.h[synthClass1];
				$r = this7.keys();
				return $r;
			}(this));
			while( $it2.hasNext() ) {
				var fkField1 = $it2.next();
				var objList = [];
				var $it3 = (function($this) {
					var $r;
					var this8;
					{
						var this9;
						this9 = __map_reserved[synthClass1] != null?classToFetch.getReserved(synthClass1):classToFetch.h[synthClass1];
						this8 = this9.get(fkField1);
					}
					$r = this8.keys();
					return $r;
				}(this));
				while( $it3.hasNext() ) {
					var objId = $it3.next();
					objList.push(objId);
				}
				batchQuery.getByValues(objList,Type.resolveClass(synthClass1),fkField1,"__IGNORED__",null);
			}
		}
		batchQuery.onComplete = function() {
			var _g2 = 0;
			while(_g2 < objects.length) {
				var object1 = objects[_g2];
				++_g2;
				var clazz1 = Type.getClass(object1);
				if(object1 == null || js.Boot.__instanceof(object1,ArrayBuffer) || clazz1 == null) continue;
				var clazzName1 = Type.getClassName(clazz1);
				if(_g1.theBindingMap.exists(clazzName1)) {
					if((function($this) {
						var $r;
						var this10 = _g1.theBindingMap.get(clazzName1);
						$r = this10.exists("fields.synthetic");
						return $r;
					}(this))) {
						var synthFields1;
						var this11 = _g1.theBindingMap.get(clazzName1);
						synthFields1 = this11.get("fields.synthetic");
						var $it4 = synthFields1.keys();
						while( $it4.hasNext() ) {
							var synthFieldName1 = $it4.next();
							var synthVal1 = Reflect.field(object1,synthFieldName1);
							if(synthVal1 != null) continue;
							var synthInfo1;
							synthInfo1 = __map_reserved[synthFieldName1] != null?synthFields1.getReserved(synthFieldName1):synthFields1.h[synthFieldName1];
							var isPolymorphic1 = synthInfo1.exists("selector_field");
							var synthClass2;
							if(isPolymorphic1) {
								var selectorField1 = synthInfo1.get("selector_field");
								var objValue1 = Reflect.field(object1,selectorField1);
								if(synthInfo1.get("selector_values").exists(objValue1)) synthClass2 = synthInfo1.get("selector_values").get(objValue1); else continue;
								var selectorValue1 = synthInfo1.get("selector_value");
								synthFieldName1 = "_MERGE";
							} else synthClass2 = synthInfo1.get("class");
							var field1 = synthInfo1.get("field");
							var val1 = Reflect.field(object1,field1);
							if(val1 != null && val1 != "") {
								var fkField2 = synthInfo1.get("fk_field");
								if(synthInfo1.exists("selector_field")) synthFieldName1 = "_MERGE";
								var cacheObj1 = _g1.getObjectFromCache(Type.resolveClass(synthClass2),fkField2,val1);
								if(cacheObj1 != null) object1[synthFieldName1] = cacheObj1;
							}
						}
					}
				}
			}
			var newObjList = [];
			var _g3 = 0;
			while(_g3 < objects.length) {
				var object2 = objects[_g3];
				++_g3;
				var clazz2 = Type.getClass(object2);
				if(object2 == null || js.Boot.__instanceof(object2,ArrayBuffer) || clazz2 == null) continue;
				var model = _g1.getModel(clazz2);
				if(model != null) {
					var _g21 = 0;
					var _g31 = Reflect.fields(object2);
					while(_g21 < _g31.length) {
						var field2 = _g31[_g21];
						++_g21;
						var val2 = Reflect.field(object2,field2);
						if(!model.isSyntheticallyBound(field2) || val2 == null) continue;
						var objs = Reflect.field(object2,field2);
						if(!((objs instanceof Array) && objs.__enum__ == null)) objs = [objs];
						var _g4 = 0;
						while(_g4 < objs.length) {
							var newObject = objs[_g4];
							++_g4;
							newObjList.push(newObject);
						}
					}
				}
			}
			if(newObjList.length > 0 && depthLimit > depth) _g1._activate(newObjList,depth + 1,depthLimit,callBack); else callBack(null);
		};
		batchQuery.execute();
	}
	,merge: function(objects) {
		var toVisit = [];
		var _g1 = 0;
		var _g = objects.length;
		while(_g1 < _g) {
			var i = _g1++;
			toVisit.push({ 'parent' : objects, 'pos' : i, 'value' : objects[i]});
		}
		this._merge(toVisit);
	}
	,_merge: function(toVisit) {
		while(true) {
			if(toVisit.length == 0) break;
			var item = toVisit.pop();
			var original = Reflect.field(item,"value");
			if(Object.prototype.hasOwnProperty.call(original,"_MERGE")) {
				var obj = Reflect.field(original,"_MERGE");
				var _g = 0;
				var _g1 = Reflect.fields(original);
				while(_g < _g1.length) {
					var field = _g1[_g];
					++_g;
					if(field != "_MERGE") Reflect.setField(obj,field,Reflect.field(original,field));
				}
				var parent = Reflect.field(item,"parent");
				if(Object.prototype.hasOwnProperty.call(item,"pos")) parent[Reflect.field(item,"pos")] = obj; else Reflect.setField(parent,Reflect.field(item,"field"),obj);
				original = obj;
			}
			var model = this.getModel(original);
			if(model == null) continue;
			var _g2 = 0;
			var _g11 = model.getAttributes();
			while(_g2 < _g11.length) {
				var field1 = _g11[_g2];
				++_g2;
				var value = Reflect.field(original,field1);
				var isObject = false;
				isObject = Std["is"](value,Object);
				if(isObject) {
					if((value instanceof Array) && value.__enum__ == null) {
						var _g3 = 0;
						var _g21 = value.length;
						while(_g3 < _g21) {
							var i = _g3++;
							toVisit.push({ 'parent' : value, 'pos' : i, 'value' : value[i]});
						}
					} else toVisit.push({ 'parent' : original, 'value' : value, 'field' : field1});
				}
			}
		}
	}
	,getModel: function(clazz) {
		if(clazz == null) return null; else {
			var t = Type.getClass(clazz);
			var className = Type.getClassName(clazz);
			return this.getModelByStringName(className);
		}
	}
	,getObjectModel: function(object) {
		if(object == null) return null; else {
			var clazz = Type.getClass(object);
			return this.getModel(clazz);
		}
	}
	,save: function(object,cb,autoAttach) {
		if(autoAttach == null) autoAttach = false;
		this.insertOrUpdate([object],cb,autoAttach);
	}
	,initModelClasses: function() {
		this.modelClasses = [];
		var $it0 = this.theBindingMap.keys();
		while( $it0.hasNext() ) {
			var classStr = $it0.next();
			saturn.core.Util.debug(classStr);
			var clazz = Type.resolveClass(classStr);
			if(clazz != null) this.modelClasses.push(this.getModel(clazz));
		}
	}
	,getModelClasses: function() {
		return this.modelClasses;
	}
	,getModelByStringName: function(className) {
		if(this.theBindingMap.exists(className)) {
			if((function($this) {
				var $r;
				var this1 = $this.theBindingMap.get(className);
				$r = this1.exists("model");
				return $r;
			}(this))) return new saturn.db.Model(this.theBindingMap.get(className),className); else return new saturn.db.Model(this.theBindingMap.get(className),className);
		} else return null;
	}
	,isModel: function(clazz) {
		if(this.theBindingMap != null) {
			var key = Type.getClassName(clazz);
			return this.theBindingMap.exists(key);
		} else return false;
	}
	,setSelectClause: function(className,selClause) {
		if(this.theBindingMap.exists(className)) {
			var this1;
			var this2 = this.theBindingMap.get(className);
			this1 = this2.get("statements");
			this1.set("SELECT",selClause);
		}
	}
	,modelToReal: function(modelDef,models,cb) {
		var _g3 = this;
		var priKey = modelDef.getPrimaryKey();
		var fields = modelDef.getFields();
		var clazz = modelDef.getClass();
		var syntheticInstanceAttributes = modelDef.getSynthenticFields();
		var syntheticSet = null;
		if(syntheticInstanceAttributes != null) {
			syntheticSet = new haxe.ds.StringMap();
			var $it0 = syntheticInstanceAttributes.keys();
			while( $it0.hasNext() ) {
				var instanceName = $it0.next();
				var fkRel;
				fkRel = __map_reserved[instanceName] != null?syntheticInstanceAttributes.getReserved(instanceName):syntheticInstanceAttributes.h[instanceName];
				var parentIdColumn = fkRel.get("fk_field");
				var childIdColumn = fkRel.get("field");
				var value;
				var _g = new haxe.ds.StringMap();
				if(__map_reserved.childIdColumn != null) _g.setReserved("childIdColumn",childIdColumn); else _g.h["childIdColumn"] = childIdColumn;
				var value1 = fkRel.get("fk_field");
				_g.set("parentIdColumn",value1);
				var value2 = fkRel.get("class");
				_g.set("class",value2);
				value = _g;
				if(__map_reserved[instanceName] != null) syntheticSet.setReserved(instanceName,value); else syntheticSet.h[instanceName] = value;
			}
		}
		var clazzToFieldToIds = new haxe.ds.StringMap();
		var _g1 = 0;
		while(_g1 < models.length) {
			var model = models[_g1];
			++_g1;
			var _g11 = 0;
			var _g2 = modelDef.getAttributes();
			while(_g11 < _g2.length) {
				var field = _g2[_g11];
				++_g11;
				if(field.indexOf(".") > -1) {
					var parts = field.split(".");
					var instanceName1 = parts[0];
					if(syntheticSet != null && (__map_reserved[instanceName1] != null?syntheticSet.existsReserved(instanceName1):syntheticSet.h.hasOwnProperty(instanceName1))) {
						var lookupField = parts[parts.length - 1];
						var lookupClazz;
						var this1;
						this1 = __map_reserved[instanceName1] != null?syntheticSet.getReserved(instanceName1):syntheticSet.h[instanceName1];
						lookupClazz = this1.get("class");
						var val = Reflect.field(model,field);
						if(val == null || val == "" && !((val | 0) === val)) continue;
						var clazz1 = Type.resolveClass(lookupClazz);
						var cachedObject = this.getObjectFromCache(clazz1,lookupField,val);
						if(cachedObject == null) {
							if(!(function($this) {
								var $r;
								var key = lookupClazz;
								$r = __map_reserved[key] != null?clazzToFieldToIds.existsReserved(key):clazzToFieldToIds.h.hasOwnProperty(key);
								return $r;
							}(this))) {
								var key1 = lookupClazz;
								var value3 = new haxe.ds.StringMap();
								if(__map_reserved[key1] != null) clazzToFieldToIds.setReserved(key1,value3); else clazzToFieldToIds.h[key1] = value3;
							}
							if(!(function($this) {
								var $r;
								var this2;
								{
									var key2 = lookupClazz;
									this2 = __map_reserved[key2] != null?clazzToFieldToIds.getReserved(key2):clazzToFieldToIds.h[key2];
								}
								$r = this2.exists(lookupField);
								return $r;
							}(this))) {
								var this3;
								var key3 = lookupClazz;
								this3 = __map_reserved[key3] != null?clazzToFieldToIds.getReserved(key3):clazzToFieldToIds.h[key3];
								var value4 = new haxe.ds.StringMap();
								this3.set(lookupField,value4);
							}
							var this4;
							var this5;
							var key4 = lookupClazz;
							this5 = __map_reserved[key4] != null?clazzToFieldToIds.getReserved(key4):clazzToFieldToIds.h[key4];
							this4 = this5.get(lookupField);
							this4.set(val,"");
						}
					}
				}
			}
		}
		var batchFetch = new saturn.db.BatchFetch(function(obj,err) {
			cb(err,obj);
		});
		var $it1 = clazzToFieldToIds.keys();
		while( $it1.hasNext() ) {
			var clazzStr = $it1.next();
			var $it2 = (function($this) {
				var $r;
				var this6;
				this6 = __map_reserved[clazzStr] != null?clazzToFieldToIds.getReserved(clazzStr):clazzToFieldToIds.h[clazzStr];
				$r = this6.keys();
				return $r;
			}(this));
			while( $it2.hasNext() ) {
				var fieldStr = $it2.next();
				var valList = [];
				var $it3 = (function($this) {
					var $r;
					var this7;
					{
						var this8;
						this8 = __map_reserved[clazzStr] != null?clazzToFieldToIds.getReserved(clazzStr):clazzToFieldToIds.h[clazzStr];
						this7 = this8.get(fieldStr);
					}
					$r = this7.keys();
					return $r;
				}(this));
				while( $it3.hasNext() ) {
					var val1 = $it3.next();
					valList.push(val1);
				}
				batchFetch.getByIds(valList,Type.resolveClass(clazzStr),"__IGNORE__",null);
			}
		}
		batchFetch.onComplete = function(err1,objs) {
			if(err1 != null) cb(err1,null); else {
				var mappedModels = [];
				var _g4 = 0;
				while(_g4 < models.length) {
					var model1 = models[_g4];
					++_g4;
					var mappedModel = Type.createEmptyInstance(clazz);
					var _g12 = 0;
					var _g21 = modelDef.getAttributes();
					while(_g12 < _g21.length) {
						var field1 = _g21[_g12];
						++_g12;
						if(field1.indexOf(".") > -1) {
							var parts1 = field1.split(".");
							var instanceName2 = parts1[0];
							if(__map_reserved[instanceName2] != null?syntheticSet.existsReserved(instanceName2):syntheticSet.h.hasOwnProperty(instanceName2)) {
								var lookupField1 = parts1[parts1.length - 1];
								var lookupClazz1;
								var this9;
								this9 = __map_reserved[instanceName2] != null?syntheticSet.getReserved(instanceName2):syntheticSet.h[instanceName2];
								lookupClazz1 = this9.get("class");
								var val2 = Reflect.field(model1,field1);
								if(val2 == null || val2 == "") continue;
								var clazz2 = Type.resolveClass(lookupClazz1);
								var cachedObject1 = _g3.getObjectFromCache(clazz2,lookupField1,val2);
								if(cachedObject1 != null) {
									var idColumn;
									var this10;
									this10 = __map_reserved[instanceName2] != null?syntheticSet.getReserved(instanceName2):syntheticSet.h[instanceName2];
									idColumn = this10.get("parentIdColumn");
									var val3 = Reflect.field(cachedObject1,idColumn);
									if(val3 == null || val3 == "" && !((val3 | 0) === val3)) {
										cb("Unexpected mapping error",mappedModels);
										return;
									}
									var dstColumn;
									var this11;
									this11 = __map_reserved[instanceName2] != null?syntheticSet.getReserved(instanceName2):syntheticSet.h[instanceName2];
									dstColumn = this11.get("childIdColumn");
									Reflect.setField(mappedModel,dstColumn,val3);
								} else {
									cb("Unable to find " + val2,mappedModels);
									return;
								}
							}
						} else {
							var val4 = Reflect.field(model1,field1);
							mappedModel[field1] = val4;
						}
					}
					mappedModels.push(mappedModel);
				}
				cb(null,mappedModels);
			}
		};
		batchFetch.execute();
	}
	,dataBinding: function(enable) {
		this.enableBinding = enable;
	}
	,isDataBinding: function() {
		return this.enableBinding;
	}
	,queryPath: function(fromClazz,queryPath,fieldValue,functionName,cb) {
		var _g = this;
		var parts = queryPath.split(".");
		var fieldName = parts.pop();
		var synthField = parts.pop();
		var model = this.getModel(fromClazz);
		if(model.isSynthetic(synthField)) {
			var fieldDef;
			var this1 = model.getSynthenticFields();
			fieldDef = this1.get(synthField);
			var childClazz = Type.resolveClass(fieldDef.get("class"));
			Reflect.callMethod(this,Reflect.field(this,functionName),[[fieldValue],childClazz,fieldName,function(objs,err) {
				if(err == null) {
					var values = [];
					var _g1 = 0;
					while(_g1 < objs.length) {
						var obj = objs[_g1];
						++_g1;
						values.push(Reflect.field(obj,fieldDef.get("fk_field")));
					}
					var parentField = fieldDef.get("field");
					_g.getByValues(values,fromClazz,parentField,function(objs1,err1) {
						cb(err1,objs1);
					});
				} else cb(err,null);
			}]);
		}
	}
	,setAutoCommit: function(autoCommit,cb) {
		cb("Set auto commit mode ");
	}
	,attach: function(objs,refreshFields,cb) {
		var _g = this;
		var bf = new saturn.db.BatchFetch(function(obj,err) {
			cb(err);
		});
		bf.setProvider(this);
		this._attach(objs,refreshFields,bf);
		bf.onComplete = function() {
			_g.synchronizeInternalLinks(objs);
			cb(null);
		};
		bf.execute();
	}
	,synchronizeInternalLinks: function(objs) {
		if(!this.isDataBinding()) return;
		var _g = 0;
		while(_g < objs.length) {
			var obj = objs[_g];
			++_g;
			var clazz = Type.getClass(obj);
			var model = this.getModel(clazz);
			var synthFields = model.getSynthenticFields();
			if(synthFields != null) {
				var $it0 = synthFields.keys();
				while( $it0.hasNext() ) {
					var synthFieldName = $it0.next();
					var synthField;
					synthField = __map_reserved[synthFieldName] != null?synthFields.getReserved(synthFieldName):synthFields.h[synthFieldName];
					var synthObj = Reflect.field(obj,synthFieldName);
					var field = synthField.get("field");
					var fkField = synthField.get("fk_field");
					if(synthObj != null) {
						if(fkField == null) Reflect.setField(obj,field,synthObj.getValue()); else {
							Reflect.setField(obj,field,Reflect.field(synthObj,fkField));
							this.synchronizeInternalLinks([synthObj]);
						}
					}
				}
			}
		}
	}
	,_attach: function(objs,refreshFields,bf) {
		var _g = 0;
		while(_g < objs.length) {
			var obj = [objs[_g]];
			++_g;
			var clazz = Type.getClass(obj[0]);
			var model = this.getModel(clazz);
			var priField = [model.getPrimaryKey()];
			var secField = model.getFirstKey();
			if(Reflect.field(obj[0],priField[0]) == null || Reflect.field(obj[0],priField[0]) == "") {
				var fieldVal = Reflect.field(obj[0],secField);
				if(fieldVal != null) bf.append(fieldVal,secField,clazz,(function(priField,obj) {
					return function(dbObj) {
						if(refreshFields) {
							var _g1 = 0;
							var _g2 = Reflect.fields(dbObj);
							while(_g1 < _g2.length) {
								var field = _g2[_g1];
								++_g1;
								Reflect.setField(obj[0],field,Reflect.field(dbObj,field));
							}
						} else Reflect.setField(obj[0],priField[0],Reflect.field(dbObj,priField[0]));
					};
				})(priField,obj));
			}
			var synthFields = model.getSynthenticFields();
			if(synthFields != null) {
				var $it0 = synthFields.keys();
				while( $it0.hasNext() ) {
					var synthFieldName = $it0.next();
					var synthField;
					synthField = __map_reserved[synthFieldName] != null?synthFields.getReserved(synthFieldName):synthFields.h[synthFieldName];
					var synthObj = Reflect.field(obj[0],synthFieldName);
					if(synthObj != null) this._attach([synthObj],refreshFields,bf);
				}
			}
		}
	}
	,getQuery: function() {
		var query = new saturn.db.query_lang.Query(this);
		return query;
	}
	,getProviderType: function() {
		return "NONE";
	}
	,isAttached: function(obj) {
		var model = this.getModel(Type.getClass(obj));
		var priField = model.getPrimaryKey();
		var val = Reflect.field(obj,priField);
		if(val == null || val == "") return false; else return true;
	}
	,insertOrUpdate: function(objs,cb,autoAttach) {
		if(autoAttach == null) autoAttach = false;
		var _g1 = this;
		var run = function() {
			var insertList = [];
			var updateList = [];
			var _g = 0;
			while(_g < objs.length) {
				var obj = objs[_g];
				++_g;
				if(!_g1.isAttached(obj)) insertList.push(obj); else updateList.push(obj);
			}
			if(insertList.length > 0) _g1.insertObjects(insertList,function(err) {
				if(err == null && updateList.length > 0) _g1.updateObjects(updateList,cb); else cb(err);
			}); else if(updateList.length > 0) _g1.updateObjects(updateList,cb);
		};
		if(autoAttach) this.attach(objs,false,function(err1) {
			if(err1 == null) run(); else cb(err1);
		}); else run();
	}
	,uploadFile: function(contents,file_identifier,cb) {
		if(file_identifier == null) bindings.NodeTemp.open("upload_file",function(err,info) {
			if(err != null) cb(err,null); else {
				var buffer = new Buffer(contents,"base64");
				js.Node.require("fs").writeFile(info.path,buffer,function(err1) {
					if(err1 != null) cb(err1,null); else {
						var client = saturn.app.SaturnServer.getDefaultServer().getRedisClient();
						var uuid = js.Node.require("node-uuid");
						var upload_key = "file_upload:" + uuid.v4();
						client.set(upload_key,info.path);
						cb(null,upload_key);
					}
				});
			}
		}); else {
			var client1 = saturn.app.SaturnServer.getDefaultServer().getRedisClient();
			client1.get(file_identifier,function(err2,filePath) {
				if(err2 != null || filePath == null || filePath == "") cb(err2,null); else {
					var decodedContents = new Buffer(contents,"base64");
					js.Node.require("fs").appendFile(filePath,decodedContents,function(err3) {
						cb(err3,file_identifier);
					});
				}
			});
		}
		return null;
	}
	,__class__: saturn.db.DefaultProvider
};
saturn.db.NamedQueryCache = $hxClasses["saturn.db.NamedQueryCache"] = function() {
};
saturn.db.NamedQueryCache.__name__ = ["saturn","db","NamedQueryCache"];
saturn.db.NamedQueryCache.prototype = {
	queryName: null
	,queryParamSerial: null
	,queryParams: null
	,queryResults: null
	,__class__: saturn.db.NamedQueryCache
};
saturn.db.Model = $hxClasses["saturn.db.Model"] = function(model,name) {
	this.customSearchFunctionPath = null;
	this.theModel = model;
	this.theName = name;
	this.alias = "";
	this.actionMap = new haxe.ds.StringMap();
	if(this.theModel.exists("indexes")) {
		var i = 0;
		var $it0 = (function($this) {
			var $r;
			var this1 = $this.theModel.get("indexes");
			$r = this1.keys();
			return $r;
		}(this));
		while( $it0.hasNext() ) {
			var keyName = $it0.next();
			if(i == 0) this.busSingleColKey = keyName;
			if((function($this) {
				var $r;
				var this2 = $this.theModel.get("indexes");
				$r = this2.get(keyName);
				return $r;
			}(this))) this.priColKey = keyName;
			i++;
		}
	}
	if(this.theModel.exists("provider_name")) {
		var name1;
		name1 = js.Boot.__cast(this.theModel.get("provider_name") , String);
		this.setProviderName(name1);
	}
	if(this.theModel.exists("programs")) {
		this.programs = [];
		var $it1 = (function($this) {
			var $r;
			var this3 = $this.theModel.get("programs");
			$r = this3.keys();
			return $r;
		}(this));
		while( $it1.hasNext() ) {
			var program = $it1.next();
			this.programs.push(program);
		}
	}
	this.stripIdPrefix = false;
	this.autoActivate = -1;
	if(this.theModel.exists("options")) {
		var options = this.theModel.get("options");
		if(__map_reserved.id_pattern != null?options.existsReserved("id_pattern"):options.h.hasOwnProperty("id_pattern")) this.setIdRegEx(__map_reserved.id_pattern != null?options.getReserved("id_pattern"):options.h["id_pattern"]);
		if(__map_reserved.custom_search_function != null?options.existsReserved("custom_search_function"):options.h.hasOwnProperty("custom_search_function")) this.customSearchFunctionPath = __map_reserved.custom_search_function != null?options.getReserved("custom_search_function"):options.h["custom_search_function"];
		if(__map_reserved.constraints != null?options.existsReserved("constraints"):options.h.hasOwnProperty("constraints")) {
			if((__map_reserved.constraints != null?options.getReserved("constraints"):options.h["constraints"]).exists("user_constraint_field")) this.userConstraintField = (__map_reserved.constraints != null?options.getReserved("constraints"):options.h["constraints"]).get("user_constraint_field");
			if((__map_reserved.constraints != null?options.getReserved("constraints"):options.h["constraints"]).exists("public_constraint_field")) this.publicConstraintField = (__map_reserved.constraints != null?options.getReserved("constraints"):options.h["constraints"]).get("public_constraint_field");
		}
		if(__map_reserved.windows_allowed_paths != null?options.getReserved("windows_allowed_paths"):options.h["windows_allowed_paths"]) {
			var value = this.compileRegEx(__map_reserved.windows_allowed_paths != null?options.getReserved("windows_allowed_paths"):options.h["windows_allowed_paths"]);
			options.set("windows_allowed_paths_regex",value);
		}
		if(__map_reserved.linux_allowed_paths != null?options.getReserved("linux_allowed_paths"):options.h["linux_allowed_paths"]) {
			var value1 = this.compileRegEx(__map_reserved.linux_allowed_paths != null?options.getReserved("linux_allowed_paths"):options.h["linux_allowed_paths"]);
			options.set("linux_allowed_paths_regex",value1);
		}
		if(__map_reserved.strip_id_prefix != null?options.existsReserved("strip_id_prefix"):options.h.hasOwnProperty("strip_id_prefix")) this.stripIdPrefix = __map_reserved.strip_id_prefix != null?options.getReserved("strip_id_prefix"):options.h["strip_id_prefix"];
		if(__map_reserved.alias != null?options.existsReserved("alias"):options.h.hasOwnProperty("alias")) this.alias = __map_reserved.alias != null?options.getReserved("alias"):options.h["alias"];
		if(__map_reserved.flags != null?options.existsReserved("flags"):options.h.hasOwnProperty("flags")) this.flags = __map_reserved.flags != null?options.getReserved("flags"):options.h["flags"]; else this.flags = new haxe.ds.StringMap();
		if(__map_reserved["file.new.label"] != null?options.existsReserved("file.new.label"):options.h.hasOwnProperty("file.new.label")) this.file_new_label = __map_reserved["file.new.label"] != null?options.getReserved("file.new.label"):options.h["file.new.label"];
		if(__map_reserved.auto_activate != null?options.existsReserved("auto_activate"):options.h.hasOwnProperty("auto_activate")) this.autoActivate = Std.parseInt(__map_reserved.auto_activate != null?options.getReserved("auto_activate"):options.h["auto_activate"]);
		if(__map_reserved.actions != null?options.existsReserved("actions"):options.h.hasOwnProperty("actions")) {
			var actionTypeMap;
			actionTypeMap = __map_reserved.actions != null?options.getReserved("actions"):options.h["actions"];
			var $it2 = actionTypeMap.keys();
			while( $it2.hasNext() ) {
				var actionType = $it2.next();
				var actions;
				actions = __map_reserved[actionType] != null?actionTypeMap.getReserved(actionType):actionTypeMap.h[actionType];
				var value2 = new haxe.ds.StringMap();
				this.actionMap.set(actionType,value2);
				var $it3 = actions.keys();
				while( $it3.hasNext() ) {
					var actionName = $it3.next();
					var actionDef;
					actionDef = __map_reserved[actionName] != null?actions.getReserved(actionName):actions.h[actionName];
					if(!(__map_reserved.user_suffix != null?actionDef.existsReserved("user_suffix"):actionDef.h.hasOwnProperty("user_suffix"))) throw new js._Boot.HaxeError(new saturn.util.HaxeException(actionName + " action definition for " + this.getName() + " is missing user_suffix option"));
					if(!(__map_reserved["function"] != null?actionDef.existsReserved("function"):actionDef.h.hasOwnProperty("function"))) throw new js._Boot.HaxeError(new saturn.util.HaxeException(actionName + " action definition for " + this.getName() + " is missing function option"));
					var action = new saturn.db.ModelAction(actionName,__map_reserved.user_suffix != null?actionDef.getReserved("user_suffix"):actionDef.h["user_suffix"],__map_reserved["function"] != null?actionDef.getReserved("function"):actionDef.h["function"],__map_reserved.icon != null?actionDef.getReserved("icon"):actionDef.h["icon"]);
					if(actionType == "search_bar") {
						var clazz = Type.resolveClass(action.className);
						if(clazz == null) throw new js._Boot.HaxeError(new saturn.util.HaxeException(action.className + " does not exist for action " + actionName));
						var instanceFields = Type.getInstanceFields(clazz);
						var match = false;
						var _g = 0;
						while(_g < instanceFields.length) {
							var field = instanceFields[_g];
							++_g;
							if(field == action.functionName) {
								match = true;
								break;
							}
						}
						if(!match) throw new js._Boot.HaxeError(new saturn.util.HaxeException(action.className + " does not have function " + action.functionName + " for action " + actionName));
					}
					var this4 = this.actionMap.get(actionType);
					this4.set(actionName,action);
				}
			}
		}
	} else {
		this.flags = new haxe.ds.StringMap();
		var value3 = new haxe.ds.StringMap();
		this.actionMap.set("searchBar",value3);
	}
	if(this.theModel.exists("search")) {
		var fts = this.theModel.get("search");
		this.ftsColumns = new haxe.ds.StringMap();
		var $it4 = fts.keys();
		while( $it4.hasNext() ) {
			var key = $it4.next();
			var searchDef;
			searchDef = __map_reserved[key] != null?fts.getReserved(key):fts.h[key];
			var searchObj = new saturn.db.SearchDef();
			if(searchDef != null) {
				if(typeof(searchDef) == "boolean" && searchDef) this.ftsColumns.set(key,searchObj); else if(typeof(searchDef) == "string") searchObj.regex = new EReg(searchDef,""); else {
					if(searchDef.exists("search_when")) {
						var regexStr = searchDef.get("search_when");
						if(regexStr != null && regexStr != "") searchObj.regex = new EReg(regexStr,"");
					}
					if(searchDef.exists("replace_with")) searchObj.replaceWith = searchDef.get("replace_with");
				}
			}
			this.ftsColumns.set(key,searchObj);
		}
	}
	if(this.alias == null || this.alias == "") this.alias = this.theName;
};
saturn.db.Model.__name__ = ["saturn","db","Model"];
saturn.db.Model.generateIDMap = function(objs) {
	if(objs == null || objs.length == 0) return null; else {
		var map = new haxe.ds.StringMap();
		var model = saturn.core.Util.getProvider().getModel(Type.getClass(objs[0]));
		var firstKey = model.getFirstKey();
		var priKey = model.getPrimaryKey();
		var _g = 0;
		while(_g < objs.length) {
			var obj = objs[_g];
			++_g;
			var key = Reflect.field(obj,firstKey);
			var value = Reflect.field(obj,priKey);
			if(__map_reserved[key] != null) map.setReserved(key,value); else map.h[key] = value;
		}
		return map;
	}
};
saturn.db.Model.generateUniqueList = function(objs) {
	if(objs == null || objs.length == 0) return null; else {
		var model = saturn.core.Util.getProvider().getModel(Type.getClass(objs[0]));
		var firstKey = model.getFirstKey();
		return saturn.db.Model.generateUniqueListWithField(objs,firstKey);
	}
};
saturn.db.Model.generateUniqueListWithField = function(objs,field) {
	var set = new haxe.ds.StringMap();
	var _g = 0;
	while(_g < objs.length) {
		var obj = objs[_g];
		++_g;
		var key = saturn.db.Model.extractField(obj,field);
		if(__map_reserved[key] != null) set.setReserved(key,null); else set.h[key] = null;
	}
	var ids = [];
	var $it0 = set.keys();
	while( $it0.hasNext() ) {
		var key1 = $it0.next();
		ids.push(key1);
	}
	return ids;
};
saturn.db.Model.extractField = function(obj,field) {
	if(field.indexOf(".") < 0) return Reflect.field(obj,field); else {
		var a = field.indexOf(".") - 1;
		var nextField = field.substring(0,a + 1);
		var nextObj = Reflect.field(obj,nextField);
		var remaining = field.substring(a + 2,field.length);
		return saturn.db.Model.extractField(nextObj,remaining);
	}
};
saturn.db.Model.setField = function(obj,field,value,newTerminal) {
	if(newTerminal == null) newTerminal = false;
	if(field.indexOf(".") < 0) obj[field] = value; else {
		var a = field.indexOf(".") - 1;
		var nextField = field.substring(0,a + 1);
		var nextObj = Reflect.field(obj,nextField);
		var remaining = field.substring(a + 2,field.length);
		if(nextObj == null || newTerminal && remaining.indexOf(".") < 0) {
			var clazz = Type.getClass(obj);
			if(clazz != null) {
				var model = saturn.core.Util.getProvider().getModel(clazz);
				var synthDef;
				var this1 = model.getSynthenticFields();
				synthDef = this1.get(nextField);
				if(synthDef != null) {
					var clazzStr = synthDef.get("class");
					nextObj = Type.createInstance(Type.resolveClass(clazzStr),[]);
					obj[nextField] = nextObj;
					Reflect.setField(obj,synthDef.field,null);
				}
			}
		}
		saturn.db.Model.setField(nextObj,remaining,value);
	}
};
saturn.db.Model.getModel = function(obj) {
	return saturn.core.Util.getProvider().getModel(Type.getClass(obj));
};
saturn.db.Model.generateMap = function(objs) {
	var model = saturn.db.Model.getModel(objs[0]);
	var firstKey = model.getFirstKey();
	return saturn.db.Model.generateMapWithField(objs,firstKey);
};
saturn.db.Model.generateMapWithField = function(objs,field) {
	var map = new haxe.ds.StringMap();
	var _g = 0;
	while(_g < objs.length) {
		var obj = objs[_g];
		++_g;
		var key = saturn.db.Model.extractField(obj,field);
		var value = obj;
		map.set(key,value);
	}
	return map;
};
saturn.db.Model.prototype = {
	theModel: null
	,theName: null
	,busSingleColKey: null
	,priColKey: null
	,idRegEx: null
	,stripIdPrefix: null
	,file_new_label: null
	,searchMap: null
	,ftsColumns: null
	,alias: null
	,programs: null
	,flags: null
	,autoActivate: null
	,actionMap: null
	,providerName: null
	,publicConstraintField: null
	,userConstraintField: null
	,customSearchFunctionPath: null
	,getFileNewLabel: function() {
		return this.file_new_label;
	}
	,isProgramSaveAs: function(clazzName) {
		if(this.theModel.exists("programs") && (function($this) {
			var $r;
			var this1 = $this.theModel.get("programs");
			$r = this1.get(clazzName);
			return $r;
		}(this))) return true; else if((function($this) {
			var $r;
			var this2 = $this.theModel.get("options");
			$r = this2.exists("canSave");
			return $r;
		}(this))) return ((function($this) {
			var $r;
			var this3 = $this.theModel.get("options");
			$r = this3.get("canSave");
			return $r;
		}(this))).get(clazzName); else return false;
	}
	,getProviderName: function() {
		return this.providerName;
	}
	,setProviderName: function(name) {
		this.providerName = name;
	}
	,getActions: function(actionType) {
		if(this.actionMap.exists(actionType)) return this.actionMap.get(actionType); else return new haxe.ds.StringMap();
	}
	,getAutoActivateLevel: function() {
		return this.autoActivate;
	}
	,hasFlag: function(flag) {
		if(this.flags.exists(flag)) return this.flags.get(flag); else return false;
	}
	,getCustomSearchFunction: function() {
		return this.customSearchFunctionPath;
	}
	,getPrograms: function() {
		return this.programs;
	}
	,getAlias: function() {
		return this.alias;
	}
	,getFTSColumns: function() {
		if(this.ftsColumns != null) return this.ftsColumns; else return null;
	}
	,getSearchMap: function() {
		return this.searchMap;
	}
	,getOptions: function() {
		return this.theModel.get("options");
	}
	,compileRegEx: function(regexs) {
		var cregexs = new haxe.ds.StringMap();
		var $it0 = regexs.keys();
		while( $it0.hasNext() ) {
			var key = $it0.next();
			var regex;
			regex = __map_reserved[key] != null?regexs.getReserved(key):regexs.h[key];
			if(regex != "") {
				var value = new EReg(regex,"");
				if(__map_reserved[key] != null) cregexs.setReserved(key,value); else cregexs.h[key] = value;
			}
		}
		return cregexs;
	}
	,setIdRegEx: function(idRegExStr) {
		this.idRegEx = new EReg(idRegExStr,"");
	}
	,getIdRegEx: function() {
		return this.idRegEx;
	}
	,isValidId: function(id) {
		if(this.idRegEx != null) return this.idRegEx.match(id); else return false;
	}
	,stripPrefixes: function() {
		return this.stripIdPrefix;
	}
	,processId: function(id) {
		if(this.stripIdPrefix) id = this.idRegEx.replace(id,"");
		return id;
	}
	,getIndexes: function() {
		var indexFields = [];
		var $it0 = (function($this) {
			var $r;
			var this1 = $this.theModel.get("indexes");
			$r = this1.keys();
			return $r;
		}(this));
		while( $it0.hasNext() ) {
			var keyName = $it0.next();
			indexFields.push(keyName);
		}
		return indexFields;
	}
	,getAutoFunctions: function() {
		if(this.theModel.exists("auto_functions")) return this.theModel.get("auto_functions"); else return null;
	}
	,getFields: function() {
		var fields = [];
		var $it0 = (function($this) {
			var $r;
			var this1 = $this.theModel.get("model");
			$r = this1.iterator();
			return $r;
		}(this));
		while( $it0.hasNext() ) {
			var field = $it0.next();
			fields.push(field);
		}
		return fields;
	}
	,getAttributes: function() {
		var fields = [];
		if(this.theModel.exists("fields")) {
			var $it0 = (function($this) {
				var $r;
				var this1 = $this.theModel.get("fields");
				$r = this1.keys();
				return $r;
			}(this));
			while( $it0.hasNext() ) {
				var field = $it0.next();
				fields.push(field);
			}
		}
		return fields;
	}
	,isField: function(field) {
		var this1 = this.theModel.get("fields");
		return this1.exists(field);
	}
	,isRDBMSField: function(rdbmsField) {
		var fields = this.theModel.get("fields");
		var $it0 = fields.keys();
		while( $it0.hasNext() ) {
			var field = $it0.next();
			if((__map_reserved[field] != null?fields.getReserved(field):fields.h[field]) == rdbmsField) return true;
		}
		return false;
	}
	,modelAtrributeToRDBMS: function(field) {
		var this1 = this.theModel.get("fields");
		return this1.get(field);
	}
	,hasDefaults: function() {
		return this.theModel.exists("defaults");
	}
	,hasOptions: function() {
		return this.theModel.exists("options");
	}
	,getFieldDefault: function(field) {
		if(this.hasDefaults() && (function($this) {
			var $r;
			var this1 = $this.theModel.get("defaults");
			$r = this1.exists(field);
			return $r;
		}(this))) {
			var this2 = this.theModel.get("defaults");
			return this2.get(field);
		} else return null;
	}
	,hasRequired: function() {
		return this.theModel.exists("required");
	}
	,isRequired: function(field) {
		if(this.hasRequired()) {
			if((function($this) {
				var $r;
				var this1 = $this.theModel.get("required");
				$r = this1.exists(field);
				return $r;
			}(this))) return true; else if(field.indexOf(".") > 0) {
				var cmps = field.split(".");
				var refField = this.getSyntheticallyBoundField(cmps[0]);
				return this.isRequired(refField);
			}
		}
		return false;
	}
	,getFieldDefs: function() {
		var fields = [];
		var defaults = null;
		if(this.theModel.exists("defaults")) defaults = this.theModel.get("defaults"); else return this.getFields();
		var $it0 = (function($this) {
			var $r;
			var this1 = $this.theModel.get("model");
			$r = this1.iterator();
			return $r;
		}(this));
		while( $it0.hasNext() ) {
			var field = $it0.next();
			var val = null;
			if(__map_reserved[field] != null?defaults.existsReserved(field):defaults.h.hasOwnProperty(field)) {
				var this2 = this.theModel.get("defaults");
				val = this2.get(field);
			}
			fields.push({ name : field, defaultValue : val});
		}
		return fields;
	}
	,getUserFieldDefinitions: function() {
		var fields = [];
		var defaults = null;
		if(this.theModel.exists("defaults")) defaults = this.theModel.get("defaults"); else defaults = new haxe.ds.StringMap();
		var model = this.theModel.get("model");
		if(model == null) return null;
		var $it0 = model.keys();
		while( $it0.hasNext() ) {
			var field = $it0.next();
			var val = null;
			if(__map_reserved[field] != null?defaults.existsReserved(field):defaults.h.hasOwnProperty(field)) {
				var this1 = this.theModel.get("defaults");
				val = this1.get(field);
			}
			fields.push({ name : field, defaultValue : val, field : (function($this) {
				var $r;
				var this2 = $this.theModel.get("model");
				$r = this2.get(field);
				return $r;
			}(this))});
		}
		return fields;
	}
	,convertUserFieldName: function(userFieldName) {
		if(this.theModel.exists("model")) {
			if((function($this) {
				var $r;
				var this1 = $this.theModel.get("model");
				$r = this1.exists(userFieldName);
				return $r;
			}(this))) {
				var this2 = this.theModel.get("model");
				return this2.get(userFieldName);
			} else return null;
		} else return null;
	}
	,getExtTableDefinition: function() {
		var tableDefinition = [];
		var $it0 = (function($this) {
			var $r;
			var this1 = $this.theModel.get("model");
			$r = this1.keys();
			return $r;
		}(this));
		while( $it0.hasNext() ) {
			var name = $it0.next();
			var field;
			var this2 = this.theModel.get("model");
			field = this2.get(name);
			var def = { header : name, dataIndex : field, editor : "textfield"};
			if(this.isRequired(field)) {
				def.tdCls = "required-column";
				def.allowBlank = false;
			}
			tableDefinition.push(def);
		}
		return tableDefinition;
	}
	,getSynthenticFields: function() {
		return this.theModel.get("fields.synthetic");
	}
	,isSyntheticallyBound: function(fieldName) {
		var synthFields = this.theModel.get("fields.synthetic");
		if(synthFields != null) {
			var $it0 = synthFields.keys();
			while( $it0.hasNext() ) {
				var syntheticFieldName = $it0.next();
				if((__map_reserved[syntheticFieldName] != null?synthFields.getReserved(syntheticFieldName):synthFields.h[syntheticFieldName]).get("field") == fieldName) return true;
			}
		}
		return false;
	}
	,isSynthetic: function(fieldName) {
		if(this.theModel.exists("fields.synthetic")) {
			var this1 = this.theModel.get("fields.synthetic");
			return this1.exists(fieldName);
		} else return false;
	}
	,getPseudoSyntheticObjectName: function(fieldName) {
		if(this.theModel.exists("fields.synthetic")) {
			var $it0 = (function($this) {
				var $r;
				var this1 = $this.theModel.get("fields.synthetic");
				$r = this1.keys();
				return $r;
			}(this));
			while( $it0.hasNext() ) {
				var objName = $it0.next();
				if(((function($this) {
					var $r;
					var this2 = $this.theModel.get("fields.synthetic");
					$r = this2.get(objName);
					return $r;
				}(this))).get("fk_field") == null) {
					var boundField = ((function($this) {
						var $r;
						var this3 = $this.theModel.get("fields.synthetic");
						$r = this3.get(objName);
						return $r;
					}(this))).get("field");
					if(fieldName == boundField) return objName;
				}
			}
		}
		return null;
	}
	,getSyntheticallyBoundField: function(syntheticFieldName) {
		if(this.theModel.exists("fields.synthetic")) {
			if((function($this) {
				var $r;
				var this1 = $this.theModel.get("fields.synthetic");
				$r = this1.exists(syntheticFieldName);
				return $r;
			}(this))) return ((function($this) {
				var $r;
				var this2 = $this.theModel.get("fields.synthetic");
				$r = this2.get(syntheticFieldName);
				return $r;
			}(this))).get("field");
		}
		return null;
	}
	,getClass: function() {
		return Type.resolveClass(this.theName);
	}
	,getFirstKey: function() {
		return this.busSingleColKey;
	}
	,getIcon: function() {
		if(this.hasOptions()) {
			if((function($this) {
				var $r;
				var this1 = $this.getOptions();
				$r = this1.exists("icon");
				return $r;
			}(this))) {
				var this2 = this.getOptions();
				return this2.get("icon");
			}
		}
		return "";
	}
	,getWorkspaceWrapper: function() {
		if(this.hasOptions()) {
			if((function($this) {
				var $r;
				var this1 = $this.getOptions();
				$r = this1.exists("workspace_wrapper");
				return $r;
			}(this))) {
				var this2 = this.getOptions();
				return this2.get("workspace_wrapper");
			}
		}
		return "";
	}
	,getWorkspaceWrapperClass: function() {
		return Type.resolveClass(this.getWorkspaceWrapper());
	}
	,getPrimaryKey: function() {
		return this.priColKey;
	}
	,getName: function() {
		return this.theName;
	}
	,getExtModelName: function() {
		return this.theName + ".MODEL";
	}
	,getExtStoreName: function() {
		return this.theName + ".STORE";
	}
	,getFirstKey_rdbms: function() {
		var this1 = this.theModel.get("fields");
		var key = this.getFirstKey();
		return this1.get(key);
	}
	,getSqlColumn: function(field) {
		var this1 = this.theModel.get("fields");
		return this1.get(field);
	}
	,unbindFieldName: function(field) {
		return this.getSqlColumn(field);
	}
	,getPrimaryKey_rdbms: function() {
		var this1 = this.theModel.get("fields");
		var key = this.getPrimaryKey();
		return this1.get(key);
	}
	,getSchemaName: function() {
		var this1 = this.theModel.get("table_info");
		return this1.get("schema");
	}
	,getTableName: function() {
		var this1 = this.theModel.get("table_info");
		return this1.get("name");
	}
	,getQualifiedTableName: function() {
		var schemaName = this.getSchemaName();
		if(schemaName == null || schemaName == "") return this.getTableName(); else return this.getSchemaName() + "." + this.getTableName();
	}
	,hasTableInfo: function() {
		return this.theModel.exists("table_info");
	}
	,getSelectClause: function() {
		var this1 = this.theModel.get("statements");
		return this1.get("SELECT");
	}
	,setInsertClause: function(insertClause) {
		var this1 = this.theModel.get("statements");
		this1.set("INSERT",insertClause);
	}
	,getInsertClause: function() {
		var this1 = this.theModel.get("statements");
		return this1.get("INSERT");
	}
	,setUpdateClause: function(updateClause) {
		var this1 = this.theModel.get("statements");
		this1.set("UPDATE",updateClause);
	}
	,getUpdateClause: function() {
		var this1 = this.theModel.get("statements");
		return this1.get("UPDATE");
	}
	,setDeleteClause: function(deleteClause) {
		var this1 = this.theModel.get("statements");
		this1.set("DELETE",deleteClause);
	}
	,getDeleteClause: function() {
		var this1 = this.theModel.get("statements");
		return this1.get("DELETE");
	}
	,setSelectKeyClause: function(selKeyClause) {
		var this1 = this.theModel.get("statements");
		this1.set("SELECT_KEY",selKeyClause);
	}
	,getSelectKeyClause: function() {
		var this1 = this.theModel.get("statements");
		return this1.get("SELECT_KEY");
	}
	,setColumns: function(columns) {
		var this1 = this.theModel.get("statements");
		this1.set("COLUMNS",columns);
		var colSet = new haxe.ds.StringMap();
		var _g = 0;
		while(_g < columns.length) {
			var column = columns[_g];
			++_g;
			if(__map_reserved[column] != null) colSet.setReserved(column,""); else colSet.h[column] = "";
		}
		var this2 = this.theModel.get("statements");
		this2.set("COLUMNS_SET",colSet);
	}
	,getColumns: function() {
		var this1 = this.theModel.get("statements");
		return this1.get("COLUMNS");
	}
	,getColumnSet: function() {
		var this1 = this.theModel.get("statements");
		return this1.get("COLUMNS_SET");
	}
	,getSelectorField: function() {
		if(this.theModel.exists("selector")) {
			var this1 = this.theModel.get("selector");
			return this1.get("polymorph_key");
		} else return null;
	}
	,getSelectorValue: function() {
		var this1 = this.theModel.get("selector");
		return this1.get("value");
	}
	,isPolymorph: function() {
		return this.theModel.exists("selector");
	}
	,getUserConstraintField: function() {
		return this.userConstraintField;
	}
	,getPublicConstraintField: function() {
		return this.publicConstraintField;
	}
	,__class__: saturn.db.Model
};
saturn.db.SearchDef = $hxClasses["saturn.db.SearchDef"] = function() {
	this.replaceWith = null;
	this.regex = null;
};
saturn.db.SearchDef.__name__ = ["saturn","db","SearchDef"];
saturn.db.SearchDef.prototype = {
	regex: null
	,replaceWith: null
	,__class__: saturn.db.SearchDef
};
saturn.db.ModelAction = $hxClasses["saturn.db.ModelAction"] = function(name,userSuffix,qName,icon) {
	this.name = name;
	this.userSuffix = userSuffix;
	this.setQualifiedName(qName);
	this.icon = icon;
};
saturn.db.ModelAction.__name__ = ["saturn","db","ModelAction"];
saturn.db.ModelAction.prototype = {
	name: null
	,userSuffix: null
	,functionName: null
	,className: null
	,icon: null
	,setQualifiedName: function(qName) {
		var i = qName.lastIndexOf(".");
		this.functionName = qName.substring(i + 1,qName.length);
		this.className = qName.substring(0,i);
	}
	,run: function(obj,cb) {
		Reflect.callMethod(obj,Reflect.field(obj,this.functionName),[cb]);
	}
	,__class__: saturn.db.ModelAction
};
saturn.db.NodePool = $hxClasses["saturn.db.NodePool"] = function() { };
saturn.db.NodePool.__name__ = ["saturn","db","NodePool"];
saturn.db.NodePool.generatePool = function(name,max,min,idleTimeout,log,createCb,destroyCb) {
	var genericPool = js.Node.require("generic-pool");
	var d = { 'name' : name, 'create' : createCb, 'destroy' : destroyCb, 'max' : max, 'min' : min, 'idleTimeoutMillis' : idleTimeout, 'log' : log};
	var pool = genericPool.Pool(d);
	return pool;
};
saturn.db.Pool = $hxClasses["saturn.db.Pool"] = function() { };
saturn.db.Pool.__name__ = ["saturn","db","Pool"];
saturn.db.Pool.prototype = {
	acquire: null
	,release: null
	,drain: null
	,destroyAllNow: null
	,__class__: saturn.db.Pool
};
if(!saturn.db.mapping) saturn.db.mapping = {};
if(!saturn.db.mapping.templates) saturn.db.mapping.templates = {};
saturn.db.mapping.templates.DefaultMapping = $hxClasses["saturn.db.mapping.templates.DefaultMapping"] = function() {
	this.buildModels();
};
saturn.db.mapping.templates.DefaultMapping.__name__ = ["saturn","db","mapping","templates","DefaultMapping"];
saturn.db.mapping.templates.DefaultMapping.prototype = {
	models: null
	,buildModels: function() {
		this.models = new haxe.ds.StringMap();
	}
	,__class__: saturn.db.mapping.templates.DefaultMapping
};
if(!saturn.db.provider) saturn.db.provider = {};
saturn.db.provider.GenericRDBMSProvider = $hxClasses["saturn.db.provider.GenericRDBMSProvider"] = function(models,config,autoClose) {
	this.modelsToProcess = 0;
	this.theConnection = null;
	this.debug = (js.Node.require("debug"))("saturn:sql");
	saturn.db.DefaultProvider.call(this,models,config,autoClose);
	this.config = config;
	this.user = new saturn.core.User();
	this.user.username = config.username;
	this.user.password = config.password;
	var $it0 = this.namedQueryHooks.keys();
	while( $it0.hasNext() ) {
		var hook = $it0.next();
		this.debug("Installed hook: " + hook + "/" + Std.string(this.namedQueryHooks.get(hook)));
	}
	this.debug("Platform: " + js.Node.process.platform);
	this.debug("Platform key: " + this.platform);
};
saturn.db.provider.GenericRDBMSProvider.__name__ = ["saturn","db","provider","GenericRDBMSProvider"];
saturn.db.provider.GenericRDBMSProvider.__super__ = saturn.db.DefaultProvider;
saturn.db.provider.GenericRDBMSProvider.prototype = $extend(saturn.db.DefaultProvider.prototype,{
	debug: null
	,theConnection: null
	,modelsToProcess: null
	,setPlatform: function() {
		if(js.Node.process.platform == "win32") this.platform = "windows"; else this.platform = js.Node.process.platform;
	}
	,setUser: function(user) {
		this.debug("User called");
		saturn.db.DefaultProvider.prototype.setUser.call(this,user);
	}
	,generatedLinkedClone: function() {
		var provider = saturn.db.DefaultProvider.prototype.generatedLinkedClone.call(this);
		provider.config = this.config;
		provider.debug = this.debug;
		provider.modelsToProcess = this.modelsToProcess;
		provider.theConnection = null;
		provider.user = this.user;
		return provider;
	}
	,readModels: function(cb) {
		var _g = this;
		var modelClazzes = [];
		var $it0 = this.theBindingMap.keys();
		while( $it0.hasNext() ) {
			var modelClazz = $it0.next();
			modelClazzes.push(modelClazz);
		}
		this.modelsToProcess = modelClazzes.length;
		this.getConnection(this.config,function(err,conn) {
			if(err != null) {
				_g.debug("Error getting connection for reading models");
				_g.debug(err);
				cb(err);
			} else {
				_g.debug("Querying database for model information");
				_g._readModels(modelClazzes,_g,conn,cb);
			}
		});
	}
	,_readModels: function(modelClazzes,provider,connection,cb) {
		var _g = this;
		var modelClazz = modelClazzes.pop();
		this.debug("Processing model: " + modelClazz);
		var model = provider.getModelByStringName(modelClazz);
		var captured_super = $bind(this,this.postConfigureModels);
		if(model.hasTableInfo()) {
			var keyCol = model.getFirstKey_rdbms();
			var priCol = model.getPrimaryKey_rdbms();
			var tableName = model.getTableName();
			var schemaName = model.getSchemaName();
			var qName = this.generateQualifiedName(schemaName,tableName);
			var func = function(err,cols) {
				if(err != null) cb(err); else {
					provider.setSelectClause(modelClazz,"SELECT DISTINCT " + cols.join(",") + " FROM " + qName);
					model.setInsertClause("INSERT INTO " + qName);
					model.setDeleteClause("DELETE FROM " + qName + "WHERE " + priCol + " = " + _g.dbSpecificParamPlaceholder(1));
					model.setUpdateClause("UPDATE " + qName);
					model.setSelectKeyClause("SELECT DISTINCT " + keyCol + ", " + priCol + " FROM " + qName + " ");
					model.setColumns(cols);
					_g.modelsToProcess--;
					_g.debug("Model processed: " + modelClazz);
					_g.debug(cols);
					if(_g.modelsToProcess == 0) {
						_g.postConfigureModels();
						_g.closeConnection(connection);
						if(cb != null) {
							_g.debug("All Models have been processed (handing back control to caller callback)");
							cb(null);
						}
					} else _g._readModels(modelClazzes,provider,connection,cb);
				}
			};
			this.getColumns(connection,schemaName,tableName,func);
		} else if(modelClazzes.length == 0 && this.modelsToProcess == 1) {
			this.postConfigureModels();
			this.closeConnection(connection);
			if(cb != null) {
				this.debug("All Models have been processed (handing back control to caller callback2)");
				cb(null);
			}
		} else {
			this.modelsToProcess--;
			this._readModels(modelClazzes,provider,connection,cb);
		}
	}
	,generateQualifiedName: function(schemaName,tableName) {
		return schemaName + "." + tableName;
	}
	,getColumns: function(connection,schemaName,tableName,cb) {
		connection.execute("select COLUMN_NAME from ALL_TAB_COLUMNS where OWNER=:1 AND TABLE_NAME=:2",[schemaName,tableName],function(err,results) {
			if(err == null) {
				var cols = [];
				var _g = 0;
				while(_g < results.length) {
					var row = results[_g];
					++_g;
					cols.push(Reflect.field(row,"COLUMN_NAME"));
				}
				cb(null,cols);
			} else cb(err,null);
		});
	}
	,_closeConnection: function() {
		this.debug("Closing connection!");
		if(this.theConnection != null) {
			this.theConnection.close();
			this.theConnection = null;
		}
	}
	,getConnection: function(config,cb) {
		var _g = this;
		if(!this.autoClose && this.theConnection != null) {
			this.debug("Using existing connection");
			cb(null,this.theConnection);
			return;
		}
		this._getConnection(function(err,conn) {
			_g.theConnection = conn;
			cb(err,conn);
		});
	}
	,_getConnection: function(cb) {
	}
	,_getByIds: function(ids,clazz,callBack) {
		var _g = this;
		if(clazz == saturn.core.domain.FileProxy) {
			this.handleFileRequests(ids,clazz,callBack);
			return;
		}
		var model = this.getModel(clazz);
		var selectClause = model.getSelectClause();
		var keyCol = model.getFirstKey_rdbms();
		var _g1 = 0;
		var _g2 = ids.length;
		while(_g1 < _g2) {
			var i = _g1++;
			ids[i] = ids[i].toUpperCase();
		}
		var selectorSQL = this.getSelectorFieldConstraintSQL(clazz);
		if(selectorSQL != "") selectorSQL = " AND " + selectorSQL;
		this.getConnection(this.config,function(err,connection) {
			if(err != null) callBack(null,err); else {
				var sql = selectClause + "  WHERE UPPER(" + _g.columnToStringCommand(keyCol) + ") " + _g.buildSqlInClause(ids.length,0,"upper") + " " + selectorSQL;
				var additionalSQL = _g.generateUserConstraintSQL(clazz);
				if(additionalSQL != null) sql += " AND " + additionalSQL;
				sql += " ORDER BY " + keyCol;
				_g.debug("SQL" + sql);
				try {
					connection.execute(sql,ids,function(err1,results) {
						if(err1 != null) callBack(null,err1); else {
							_g.debug("Sending results");
							callBack(results,null);
						}
						_g.closeConnection(connection);
					});
				} catch( e ) {
					if (e instanceof js._Boot.HaxeError) e = e.val;
					_g.closeConnection(connection);
					saturn.core.Util.debug(e);
					callBack(null,e);
				}
			}
		});
	}
	,_getObjects: function(clazz,callBack) {
		var _g = this;
		var model = this.getModel(clazz);
		var selectClause = model.getSelectClause();
		var selectorSQL = this.getSelectorFieldConstraintSQL(clazz);
		if(selectorSQL != "") selectorSQL = " WHERE " + selectorSQL;
		this.getConnection(this.config,function(err,connection) {
			if(err != null) callBack(null,err); else {
				var sql = selectClause + " " + selectorSQL;
				var additionalSQL = _g.generateUserConstraintSQL(clazz);
				if(additionalSQL != null) sql += " AND " + additionalSQL;
				sql += " ORDER BY " + model.getFirstKey_rdbms();
				_g.debug(sql);
				try {
					connection.execute(sql,[],function(err1,results) {
						if(err1 != null) callBack(null,err1); else callBack(results,null);
						_g.closeConnection(connection);
					});
				} catch( e ) {
					if (e instanceof js._Boot.HaxeError) e = e.val;
					_g.closeConnection(connection);
					saturn.core.Util.debug(e);
					callBack(null,e);
				}
			}
		});
	}
	,_getByValues: function(values,clazz,field,callBack) {
		var _g = this;
		if(clazz == saturn.core.domain.FileProxy) {
			this.handleFileRequests(values,clazz,callBack);
			return;
		}
		var model = this.getModel(clazz);
		var selectClause = model.getSelectClause();
		var sqlField = model.getSqlColumn(field);
		var selectorSQL = this.getSelectorFieldConstraintSQL(clazz);
		if(selectorSQL != "") selectorSQL = " AND " + selectorSQL;
		this.getConnection(this.config,function(err,connection) {
			if(err != null) callBack(null,err); else {
				var sql = selectClause + "  WHERE " + sqlField + " " + _g.buildSqlInClause(values.length) + " " + selectorSQL;
				var additionalSQL = _g.generateUserConstraintSQL(clazz);
				if(additionalSQL != null) sql += " AND " + additionalSQL;
				sql += " ORDER BY " + sqlField;
				_g.debug(sql);
				_g.debug(values);
				try {
					connection.execute(sql,values,function(err1,results) {
						if(err1 != null) callBack(null,err1); else {
							_g.debug("Result count: " + Std.string(results) + " " + Std.string(values));
							callBack(results,null);
						}
						_g.closeConnection(connection);
					});
				} catch( e ) {
					if (e instanceof js._Boot.HaxeError) e = e.val;
					_g.closeConnection(connection);
					saturn.core.Util.debug(e);
					callBack(null,e);
				}
			}
		});
	}
	,getSelectorFieldConstraintSQL: function(clazz) {
		var model = this.getModel(clazz);
		var selectorField = model.getSelectorField();
		if(selectorField != null) {
			var selectorValue = model.getSelectorValue();
			return selectorField + " = \"" + selectorValue + "\"";
		} else return "";
	}
	,buildSqlInClause: function(numIds,nextVal,func) {
		if(nextVal == null) nextVal = 0;
		var inClause_b = "";
		inClause_b += "IN(";
		var _g = 0;
		while(_g < numIds) {
			var i = _g++;
			var def = this.dbSpecificParamPlaceholder(i + 1 + nextVal);
			if(func != null) def = func + "(" + def + ")";
			if(def == null) inClause_b += "null"; else inClause_b += "" + def;
			if(i != numIds - 1) inClause_b += ",";
		}
		inClause_b += ")";
		return inClause_b;
	}
	,_getByPkeys: function(ids,clazz,callBack) {
		var _g = this;
		if(clazz == saturn.core.domain.FileProxy) {
			this.handleFileRequests(ids,clazz,callBack);
			return;
		}
		var model = this.getModel(clazz);
		var selectClause = model.getSelectClause();
		var keyCol = model.getPrimaryKey_rdbms();
		var selectorSQL = this.getSelectorFieldConstraintSQL(clazz);
		if(selectorSQL != "") selectorSQL = " AND " + selectorSQL;
		this.getConnection(this.config,function(err,connection) {
			if(err != null) callBack(null,err); else {
				var sql = selectClause + "  WHERE " + keyCol + " " + _g.buildSqlInClause(ids.length) + selectorSQL;
				var additionalSQL = _g.generateUserConstraintSQL(clazz);
				if(additionalSQL != null) sql += " AND " + additionalSQL;
				sql += " " + " ORDER BY " + keyCol;
				_g.debug(sql);
				try {
					connection.execute(sql,ids,function(err1,results) {
						if(err1 != null) callBack(null,err1); else callBack(results,null);
						_g.closeConnection(connection);
					});
				} catch( e ) {
					if (e instanceof js._Boot.HaxeError) e = e.val;
					_g.closeConnection(connection);
					callBack(null,e);
				}
			}
		});
	}
	,_query: function(query,cb) {
		var _g = this;
		this.getConnection(this.config,function(err,connection) {
			if(err != null) cb(null,err); else try {
				var visitor = new saturn.db.query_lang.SQLVisitor(_g);
				var sql = visitor.translate(query);
				_g.debug(sql);
				_g.debug(visitor.getValues());
				connection.execute(sql,visitor.getValues(),function(err1,results) {
					if(err1 != null) cb(null,err1); else {
						results = visitor.getProcessedResults(results);
						cb(results,null);
					}
					_g.closeConnection(connection);
				});
			} catch( e ) {
				if (e instanceof js._Boot.HaxeError) e = e.val;
				_g.closeConnection(connection);
				_g.debug("Error !!!!!!!!!!!!!" + Std.string(e.stack));
				cb(null,e);
			}
		});
	}
	,_getByIdStartsWith: function(id,field,clazz,limit,callBack) {
		var _g = this;
		var model = this.getModel(clazz);
		this.debug("Provider class" + Type.getClassName(js.Boot.getClass(this)));
		this.debug("Provider: " + model.getProviderName());
		var keyCol = null;
		if(field == null) keyCol = model.getFirstKey_rdbms(); else if(model.isRDBMSField(field)) keyCol = field;
		var busKey = model.getFirstKey_rdbms();
		var priCol = model.getPrimaryKey_rdbms();
		var tableName = model.getTableName();
		var schemaName = model.getSchemaName();
		var qName = this.generateQualifiedName(schemaName,tableName);
		var selectClause = "SELECT DISTINCT " + busKey + ", " + priCol;
		if(keyCol != busKey && keyCol != priCol) selectClause += ", " + keyCol;
		selectClause += " FROM " + qName;
		id = id.toUpperCase();
		var selectorSQL = this.getSelectorFieldConstraintSQL(clazz);
		if(selectorSQL != "") selectorSQL = " AND " + selectorSQL;
		if(!this.limitAtEndPosition()) {
			if(limit != null && limit != 0 && limit != -1) selectorSQL += this.generateLimitClause(limit);
		}
		this.getConnection(this.config,function(err,connection) {
			if(err != null) callBack(null,err); else {
				var sql = selectClause + "  WHERE UPPER(" + _g.columnToStringCommand(keyCol) + ") like " + _g.dbSpecificParamPlaceholder(1) + " " + selectorSQL;
				var additionalSQL = _g.generateUserConstraintSQL(clazz);
				if(additionalSQL != null) sql += " AND " + additionalSQL;
				sql += " ORDER BY " + keyCol;
				if(_g.limitAtEndPosition()) {
					if(limit != null && limit != 0 && limit != -1) sql += _g.generateLimitClause(limit);
				}
				id = "%" + id + "%";
				_g.debug("startswith" + sql);
				try {
					connection.execute(sql,[id],function(err1,results) {
						if(err1 != null) callBack(null,err1); else callBack(results,null);
						_g.closeConnection(connection);
					});
				} catch( e ) {
					if (e instanceof js._Boot.HaxeError) e = e.val;
					saturn.core.Util.debug(e);
					_g.closeConnection(connection);
					callBack(null,e);
				}
			}
		});
	}
	,limitAtEndPosition: function() {
		return false;
	}
	,generateLimitClause: function(limit) {
		return " AND ROWNUM < " + (limit | 0);
	}
	,columnToStringCommand: function(columnName) {
		return columnName;
	}
	,convertComplexQuery: function(parameters) {
	}
	,_getByNamedQuery: function(queryId,parameters,clazz,cb) {
		var _g = this;
		if(!Object.prototype.hasOwnProperty.call(this.config.named_queries,queryId)) cb(null,"Query " + queryId + " not found "); else {
			var sql = Reflect.field(this.config.named_queries,queryId);
			var realParameters = [];
			if((parameters instanceof Array) && parameters.__enum__ == null) {
				this.debug("Named query passed an Array");
				var re = new EReg("(<IN>)","");
				if(re.match(sql)) sql = re.replace(sql,this.buildSqlInClause(parameters.length));
				realParameters = parameters;
			} else {
				this.debug("Named query with other object type");
				var dbPlaceHolderI = 0;
				var attributes = Reflect.fields(parameters);
				if(attributes.length == 0) {
					cb(null,"Unknown parameter collection type");
					return;
				} else {
					this.debug("Named query passed object");
					var re_in = new EReg("^IN:","");
					var re1 = new EReg("<:([^>]+)>","");
					var convertedSQL = "";
					var matchMe = sql;
					while(matchMe != null) {
						this.debug("Looping: " + matchMe);
						this.debug("SQL: " + convertedSQL);
						if(re1.matchSub(matchMe,0)) {
							var matchLeft = re1.matchedLeft();
							var tagName = re1.matched(1);
							this.debug("MatchLeft: " + matchLeft);
							this.debug("Tag:" + tagName);
							convertedSQL += matchLeft;
							if(re_in.matchSub(tagName,0)) {
								this.debug("Found IN");
								tagName = re_in.replace(tagName,"");
								this.debug("Real Tag Name" + tagName);
								if(Object.prototype.hasOwnProperty.call(parameters,tagName)) {
									this.debug("Found array");
									var paramArray = Reflect.field(parameters,tagName);
									if((paramArray instanceof Array) && paramArray.__enum__ == null) {
										convertedSQL += this.buildSqlInClause(paramArray.length);
										var _g1 = 0;
										var _g2 = paramArray.length;
										while(_g1 < _g2) {
											var i = _g1++;
											realParameters.push(paramArray[i]);
										}
									} else {
										cb(null,"Value to attribute " + tagName + " should be an Array");
										return;
									}
								} else {
									cb(null,"Missing attribute " + tagName);
									return;
								}
							} else {
								this.debug("Found non IN argument");
								if(Object.prototype.hasOwnProperty.call(parameters,tagName)) {
									convertedSQL += this.dbSpecificParamPlaceholder(dbPlaceHolderI++);
									var value = Reflect.field(parameters,tagName);
									realParameters.push(value);
								} else {
									cb(null,"Missing attribute " + tagName);
									return;
								}
							}
							matchMe = re1.matchedRight();
							this.debug("Found right " + matchMe);
						} else {
							convertedSQL += matchMe;
							matchMe = null;
							this.debug("Terminating while");
						}
					}
					sql = convertedSQL;
				}
			}
			this.debug("SQL: " + sql);
			this.debug("Parameters: " + Std.string(realParameters));
			this.getConnection(this.config,function(err,connection) {
				if(err != null) cb(null,err); else {
					_g.debug(sql);
					try {
						connection.execute(sql,realParameters,function(err1,results) {
							_g.debug("Named query returning");
							if(err1 != null) cb(null,err1); else cb(results,null);
							_g.closeConnection(connection);
						});
					} catch( e ) {
						if (e instanceof js._Boot.HaxeError) e = e.val;
						_g.closeConnection(connection);
						cb(null,e);
					}
				}
			});
		}
	}
	,_update: function(attributeMaps,className,cb) {
		var _g = this;
		this.applyFunctions(attributeMaps,className);
		this.getConnection(this.config,function(err,connection) {
			if(err != null) cb(err); else {
				var clazz = Type.resolveClass(className);
				var model = _g.getModel(clazz);
				_g._updateRecursive(attributeMaps,model,cb,connection);
			}
		});
	}
	,_insert: function(attributeMaps,className,cb) {
		var _g = this;
		this.applyFunctions(attributeMaps,className);
		this.getConnection(this.config,function(err,connection) {
			if(err != null) cb(err); else {
				var clazz = Type.resolveClass(className);
				var model = _g.getModel(clazz);
				_g._insertRecursive(attributeMaps,model,cb,connection);
			}
		});
	}
	,cloneConfig: function() {
		var cloneData = haxe.Serializer.run(this.config);
		var unserObj = haxe.Unserializer.run(cloneData);
		return unserObj;
	}
	,_insertRecursive: function(attributeMaps,model,cb,connection) {
		var _g = this;
		this.debug("Inserting  " + Type.getClassName(model.getClass()));
		var insertClause = model.getInsertClause();
		var cols = model.getColumnSet();
		var attributeMap = attributeMaps.pop();
		var colStr = new StringBuf();
		var valList = [];
		var valStr = new StringBuf();
		var i = 0;
		var hasWork = false;
		var $it0 = attributeMap.keys();
		while( $it0.hasNext() ) {
			var attribute = $it0.next();
			if(cols != null && (__map_reserved[attribute] != null?cols.existsReserved(attribute):cols.h.hasOwnProperty(attribute))) {
				if(i > 0) {
					colStr.b += ",";
					valStr.b += ",";
				}
				i++;
				if(attribute == null) colStr.b += "null"; else colStr.b += "" + attribute;
				valStr.add(this.dbSpecificParamPlaceholder(i));
				var val;
				val = __map_reserved[attribute] != null?attributeMap.getReserved(attribute):attributeMap.h[attribute];
				if(val == "" && !((val | 0) === val)) val = null;
				valList.push(val);
				hasWork = true;
			}
		}
		if(model.isPolymorph()) {
			i++;
			colStr.add("," + model.getSelectorField());
			valStr.add("," + this.dbSpecificParamPlaceholder(i));
			valList.push(model.getSelectorValue());
			hasWork = true;
		}
		if(!hasWork) {
			this.debug("No work - returning error");
			cb("Insert failure: no mapped fields for " + Type.getClassName(model.getClass()));
			return;
		}
		var sql = insertClause + " (" + Std.string(colStr) + ") VALUES(" + Std.string(valStr) + ")";
		var keyCol = model.getFirstKey_rdbms();
		var keyVal;
		keyVal = __map_reserved[keyCol] != null?attributeMap.getReserved(keyCol):attributeMap.h[keyCol];
		this.debug("MAP:" + attributeMap.toString());
		this.debug("SQL" + sql);
		this.debug("Values" + Std.string(valList));
		try {
			connection.execute(sql,valList,function(err,results) {
				if(err != null) {
					var error = { message : StringTools.replace(err == null?"null":"" + err,"\n",""), source : keyVal};
					cb(error);
					_g.closeConnection(connection);
				} else if(attributeMaps.length == 0) {
					cb(null);
					_g.closeConnection(connection);
				} else _g._insertRecursive(attributeMaps,model,cb,connection);
			});
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			this.closeConnection(connection);
			var error1 = { message : StringTools.replace(Std.string(e),"\n",""), source : keyVal};
			cb(error1);
		}
	}
	,_updateRecursive: function(attributeMaps,model,cb,connection) {
		var _g = this;
		var updateClause = model.getUpdateClause();
		var cols = model.getColumnSet();
		var attributeMap = attributeMaps.pop();
		var valList = [];
		var updateStr = new StringBuf();
		var i = 0;
		var $it0 = attributeMap.keys();
		while( $it0.hasNext() ) {
			var attribute = $it0.next();
			if((__map_reserved[attribute] != null?cols.existsReserved(attribute):cols.h.hasOwnProperty(attribute)) && attribute != model.getPrimaryKey_rdbms()) {
				if(attribute == "DATESTAMP") continue;
				if(i > 0) updateStr.b += ",";
				i++;
				updateStr.add(attribute + " = " + this.dbSpecificParamPlaceholder(i));
				var val;
				val = __map_reserved[attribute] != null?attributeMap.getReserved(attribute):attributeMap.h[attribute];
				if(val == "") val = null;
				valList.push(val);
			}
		}
		i++;
		var keyCol = model.getPrimaryKey_rdbms();
		var sql = updateClause + " SET " + Std.string(updateStr) + " WHERE " + keyCol + " = " + this.dbSpecificParamPlaceholder(i);
		var additionalSQL = this.generateUserConstraintSQL(model.getClass());
		if(additionalSQL != null) sql += " AND " + additionalSQL;
		valList.push(__map_reserved[keyCol] != null?attributeMap.getReserved(keyCol):attributeMap.h[keyCol]);
		this.debug("SQL" + sql);
		this.debug("Values" + Std.string(valList));
		try {
			connection.execute(sql,valList,function(err,results) {
				if(err != null) {
					saturn.core.Util.debug("Error: " + err);
					cb(err);
					_g.closeConnection(connection);
				} else if(attributeMaps.length == 0) {
					cb(null);
					_g.closeConnection(connection);
				} else _g._updateRecursive(attributeMaps,model,cb,connection);
			});
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			this.closeConnection(connection);
			cb(e);
		}
	}
	,_delete: function(attributeMaps,className,cb) {
		var _g = this;
		var model = this.getModelByStringName(className);
		var priField = model.getPrimaryKey();
		var priFieldSql = model.getPrimaryKey_rdbms();
		var pkeys = [];
		var _g1 = 0;
		while(_g1 < attributeMaps.length) {
			var attributeMap = attributeMaps[_g1];
			++_g1;
			pkeys.push(__map_reserved[priFieldSql] != null?attributeMap.getReserved(priFieldSql):attributeMap.h[priFieldSql]);
		}
		var d = attributeMaps;
		var sql = "DELETE FROM " + this.generateQualifiedName(model.getSchemaName(),model.getTableName()) + " WHERE " + priFieldSql + " " + this.buildSqlInClause(pkeys.length);
		var additionalSQL = this.generateUserConstraintSQL(model.getClass());
		if(additionalSQL != null) sql += " AND " + additionalSQL;
		this.getConnection(this.config,function(err,connection) {
			if(err != null) cb(err); else try {
				connection.execute(sql,pkeys,function(err1,results) {
					if(err1 != null) {
						saturn.core.Util.debug("Error: " + err1);
						cb(err1);
						_g.closeConnection(connection);
					} else cb(null);
				});
			} catch( e ) {
				if (e instanceof js._Boot.HaxeError) e = e.val;
				_g.closeConnection(connection);
				cb(e);
			}
		});
	}
	,postConfigureModels: function() {
		saturn.db.DefaultProvider.prototype.postConfigureModels.call(this);
	}
	,parseObjectList: function(data) {
		return null;
	}
	,dbSpecificParamPlaceholder: function(i) {
		return ":" + i;
	}
	,getProviderType: function() {
		return "ORACLE";
	}
	,applyFunctions: function(attributeMaps,className) {
		var context = this.user;
		var model = this.getModelByStringName(className);
		var functions = model.getAutoFunctions();
		if(functions != null) {
			var $it0 = functions.keys();
			while( $it0.hasNext() ) {
				var field = $it0.next();
				var functionString;
				functionString = __map_reserved[field] != null?functions.getReserved(field):functions.h[field];
				var func = null;
				if(functionString == "insert.username") func = $bind(this,this.setUserName); else continue;
				var _g = 0;
				while(_g < attributeMaps.length) {
					var attributeMap = attributeMaps[_g];
					++_g;
					if(__map_reserved[field] != null?attributeMap.existsReserved(field):attributeMap.h.hasOwnProperty(field)) {
						var value = Reflect.callMethod(this,func,[__map_reserved[field] != null?attributeMap.getReserved(field):attributeMap.h[field],context]);
						attributeMap.set(field,value);
					}
				}
			}
		}
		return attributeMaps;
	}
	,setUserName: function(value,context) {
		if(context != null && context.username != null) return context.username.toUpperCase(); else return value;
	}
	,handleFileRequests: function(values,clazz,callBack) {
		var _g = this;
		var i = 0;
		var next = null;
		var results = [];
		next = function() {
			if(i < values.length) {
				var value = values[i];
				var key = value;
				_g.debug("Processing file requests");
				_g.debug(_g.conversions);
				var $it0 = _g.conversions.keys();
				while( $it0.hasNext() ) {
					var conversion = $it0.next();
					var replacement = _g.conversions.get(conversion);
					value = StringTools.replace(value,conversion,replacement);
				}
				if(_g.platform == "windows") value = StringTools.replace(value,"/","\\");
				_g.debug("Unlinking path " + value);
				js.Node.require("fs").realpath(value,function(err,abspath) {
					if(err != null) {
						_g.debug("File realpath error: " + err);
						callBack(null,saturn.app.SaturnServer.getStandardUserInputError());
					} else {
						var match = false;
						var $it1 = _g.regexs.keys();
						while( $it1.hasNext() ) {
							var key1 = $it1.next();
							if(_g.regexs.get(key1).match(value)) {
								match = true;
								break;
							}
						}
						if(match) {
							_g.debug("Reading path: " + abspath);
							js.Node.require("fs").readFile(abspath,null,function(err1,content) {
								if(err1 != null) {
									_g.debug("File read error: " + err1 + "/" + abspath);
									callBack(null,saturn.app.SaturnServer.getStandardUserInputError());
								} else {
									var match1 = false;
									var $it2 = _g.regexs.keys();
									while( $it2.hasNext() ) {
										var key2 = $it2.next();
										if(_g.regexs.get(key2).match(value)) {
											match1 = true;
											break;
										}
									}
									i++;
									results.push({ 'PATH' : key, 'CONTENT' : content});
									next();
								}
							});
						} else {
							_g.debug("File read error: " + err);
							callBack(null,saturn.app.SaturnServer.getStandardUserInputError());
						}
					}
				});
			} else callBack(results,null);
		};
		next();
	}
	,setConnection: function(conn) {
		this.theConnection = conn;
	}
	,_commit: function(cb) {
		this.getConnection(this.config,function(err,connection) {
			if(err != null) cb(err); else connection.commit(cb);
		});
	}
	,setAutoCommit: function(autoCommit,cb) {
		this.getConnection(this.config,function(err,conn) {
			if(err == null) {
				conn.setAutoCommit(autoCommit);
				cb(null);
			} else cb(err);
		});
	}
	,generateUserConstraintSQL: function(clazz) {
		var model = this.getModel(clazz);
		var publicConstraintField = model.getPublicConstraintField();
		var userConstraintField = model.getUserConstraintField();
		var sql = null;
		if(publicConstraintField != null) {
			var columnName = model.getSqlColumn(publicConstraintField);
			sql = " " + columnName + " = 'yes' ";
		}
		if(userConstraintField != null) {
			var inBlock = false;
			if(sql != null) {
				sql = "(" + sql + " OR ";
				inBlock = true;
			}
			var columnName1 = model.getSqlColumn(userConstraintField);
			sql = sql + columnName1 + " = '" + this.getUser().username.toUpperCase() + "'";
			if(inBlock) sql += " ) ";
		}
		return sql;
	}
	,__class__: saturn.db.provider.GenericRDBMSProvider
});
saturn.db.provider.MySQLProvider = $hxClasses["saturn.db.provider.MySQLProvider"] = function(models,config,autoClose) {
	saturn.db.provider.GenericRDBMSProvider.call(this,models,config,autoClose);
};
saturn.db.provider.MySQLProvider.__name__ = ["saturn","db","provider","MySQLProvider"];
saturn.db.provider.MySQLProvider.__super__ = saturn.db.provider.GenericRDBMSProvider;
saturn.db.provider.MySQLProvider.prototype = $extend(saturn.db.provider.GenericRDBMSProvider.prototype,{
	getColumns: function(connection,schemaName,tableName,cb) {
		var _g = this;
		connection.query("DESCRIBE " + schemaName + "." + tableName,[],function(err,rows) {
			if(err != null) {
				_g.debug("Got DESCRIBE exception on  " + tableName);
				cb(err,null);
			} else {
				var cols = [];
				var _g1 = 0;
				while(_g1 < rows.length) {
					var row = rows[_g1];
					++_g1;
					cols.push(row.Field);
				}
				cb(null,cols);
			}
		});
	}
	,getProviderType: function() {
		return "MYSQL";
	}
	,_closeConnection: function() {
		this.debug("Closing connection!");
		if(this.theConnection != null) {
			var d = this.theConnection;
			this.debug(Reflect.fields(d));
			d.close();
			this.theConnection = null;
		}
	}
	,limitAtEndPosition: function() {
		return true;
	}
	,generateLimitClause: function(limit) {
		return " limit " + (limit | 0);
	}
	,generateQualifiedName: function(schemaName,tableName) {
		return schemaName + "." + tableName;
	}
	,_getConnection: function(cb) {
		var _g = this;
		this.debug("Obtaining MySQL theDB");
		try {
			var mysql = js.Node.require("mysql2");
			var connection = mysql.createConnection({ host : this.config.host, user : this.user.username, password : this.user.password, database : this.config.database});
			this.debug("Connecting to " + Std.string(this.config.database) + " as " + this.user.username + " with password " + this.user.password + " on host " + Std.string(this.config.host));
			connection.on("connect",function(connect) {
				if(connect) {
					_g.debug("Connected");
					connection.execute = connection.query;
					cb(null,connection);
				} else {
					_g.debug("Unable to connect");
					cb("Unable to connect",null);
				}
			});
			connection.on("error",function(err) {
				_g.debug("Error connecting " + Std.string(err));
				_g.debug("Waiting to attempt reconnect");
				if(_g.config.auto_reconnect) haxe.Timer.delay(function() {
					_g.debug("Reconnecting");
					_g._getConnection(function(err1,conn) {
						if(err1 != null) throw new js._Boot.HaxeError("Unable to reconnect MySQL session"); else _g.theConnection = conn;
					});
				},500);
			});
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			this.debug("Error" + Std.string(e));
			cb(e,null);
			return;
		}
	}
	,dbSpecificParamPlaceholder: function(i) {
		return "?";
	}
	,__class__: saturn.db.provider.MySQLProvider
});
saturn.db.provider.OracleProvider = $hxClasses["saturn.db.provider.OracleProvider"] = function(models,config,autoClose) {
	saturn.db.provider.GenericRDBMSProvider.call(this,models,config,autoClose);
};
saturn.db.provider.OracleProvider.__name__ = ["saturn","db","provider","OracleProvider"];
saturn.db.provider.OracleProvider.__super__ = saturn.db.provider.GenericRDBMSProvider;
saturn.db.provider.OracleProvider.prototype = $extend(saturn.db.provider.GenericRDBMSProvider.prototype,{
	_getConnection: function(cb) {
	}
	,__class__: saturn.db.provider.OracleProvider
});
saturn.db.provider.PostgreSQLProvider = $hxClasses["saturn.db.provider.PostgreSQLProvider"] = function(models,config,autoClose) {
	saturn.db.provider.GenericRDBMSProvider.call(this,models,config,autoClose);
};
saturn.db.provider.PostgreSQLProvider.__name__ = ["saturn","db","provider","PostgreSQLProvider"];
saturn.db.provider.PostgreSQLProvider.__super__ = saturn.db.provider.GenericRDBMSProvider;
saturn.db.provider.PostgreSQLProvider.prototype = $extend(saturn.db.provider.GenericRDBMSProvider.prototype,{
	getProviderType: function() {
		return "PGSQL";
	}
	,getColumns: function(connection,schemaName,tableName,cb) {
		connection.execute("\r\n            SELECT\r\n                column_name\r\n            FROM\r\n                INFORMATION_SCHEMA.columns\r\n            WHERE\r\n                LOWER(table_schema)=LOWER($1) AND\r\n                LOWER(table_name)=LOWER($2)",[schemaName,tableName],function(err,rows) {
			var cols = [];
			var _g = 0;
			while(_g < rows.length) {
				var row = rows[_g];
				++_g;
				cols.push(row.column_name);
			}
			cb(null,cols);
		});
	}
	,limitAtEndPosition: function() {
		return true;
	}
	,dbSpecificParamPlaceholder: function(i) {
		return "$" + i;
	}
	,generateLimitClause: function(limit) {
		return " LIMIT " + (limit | 0);
	}
	,columnToStringCommand: function(columnName) {
		return " cast(" + columnName + " as TEXT) ";
	}
	,_getConnection: function(cb) {
		var _g = this;
		var conString = "postgres://" + this.user.username + ":" + this.user.password + "@" + Std.string(this.config.host) + "/" + Std.string(this.config.database);
		var pg = js.Node.require("pg");
		pg.connect(conString,function(err,client) {
			if(err != null) {
				_g.debug("Error connecting to PostgreSQL");
				cb(err,null);
			} else {
				client.execute = function(sql,args,cb1) {
					client.query(sql,args,function(err1,results) {
						if(err1 == null) cb1(null,results.rows); else cb1(err1,null);
					});
				};
				cb(null,client);
			}
		});
	}
	,__class__: saturn.db.provider.PostgreSQLProvider
});
saturn.db.provider.SQLiteProvider = $hxClasses["saturn.db.provider.SQLiteProvider"] = function(models,config,autoClose) {
	saturn.db.provider.GenericRDBMSProvider.call(this,models,config,autoClose);
};
saturn.db.provider.SQLiteProvider.__name__ = ["saturn","db","provider","SQLiteProvider"];
saturn.db.provider.SQLiteProvider.__super__ = saturn.db.provider.GenericRDBMSProvider;
saturn.db.provider.SQLiteProvider.prototype = $extend(saturn.db.provider.GenericRDBMSProvider.prototype,{
	getProviderType: function() {
		return "SQLITE";
	}
	,getColumns: function(connection,schemaName,tableName,cb) {
		var _g = this;
		this.debug("Getting columns for " + tableName);
		connection.serialize(function() {
			connection.all("PRAGMA table_info(" + tableName + ")",[],function(err,rows) {
				if(err != null) {
					_g.debug("Got pragma exception on  " + tableName);
					cb(err,null);
				} else {
					var cols = [];
					var _g1 = 0;
					while(_g1 < rows.length) {
						var row = rows[_g1];
						++_g1;
						cols.push(row.name);
					}
					cb(null,cols);
				}
			});
		});
	}
	,generateQualifiedName: function(schemaName,tableName) {
		return tableName;
	}
	,_getConnection: function(cb) {
		try {
			var conn = new Sqlite3(this.config.file_name);
			this.debug("Got connection");
			conn.execute = conn.all;
			cb(null,conn);
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			this.debug("Error" + Std.string(e));
			cb(e,null);
		}
	}
	,limitAtEndPosition: function() {
		return true;
	}
	,generateLimitClause: function(limit) {
		return " limit " + (limit | 0);
	}
	,__class__: saturn.db.provider.SQLiteProvider
});
if(!saturn.db.provider.hooks) saturn.db.provider.hooks = {};
saturn.db.provider.hooks.ExternalJsonHook = $hxClasses["saturn.db.provider.hooks.ExternalJsonHook"] = function() { };
saturn.db.provider.hooks.ExternalJsonHook.__name__ = ["saturn","db","provider","hooks","ExternalJsonHook"];
saturn.db.provider.hooks.ExternalJsonHook.run = function(query,params,clazz,cb,hookConfig) {
	saturn.core.Util.debug("Running external command");
	if(hookConfig == null) {
		cb(null,"Hook configuration is missing");
		return;
	}
	var program = null;
	if(Object.prototype.hasOwnProperty.call(hookConfig,"program")) program = Reflect.field(hookConfig,"program"); else {
		cb(null,"Invalid configuration, program field missing");
		return;
	}
	var progArguments = [];
	if(Object.prototype.hasOwnProperty.call(hookConfig,"arguments")) {
		var localprogArguments = Reflect.field(hookConfig,"arguments");
		var _g = 0;
		while(_g < localprogArguments.length) {
			var arg = localprogArguments[_g];
			++_g;
			progArguments.push(arg);
		}
	}
	var config = params[0];
	bindings.NodeTemp.open("input_json",function(err,fh_input) {
		if(err != null) {
			saturn.core.Util.debug("Error generating temporary input file name");
			cb(null,err);
		} else {
			var run = function() {
				var inputJsonStr = JSON.stringify(config);
				js.Node.require("fs").writeFileSync(fh_input.path,inputJsonStr);
				bindings.NodeTemp.open("output_json",function(err1,fh_output) {
					if(err1 != null) {
						saturn.core.Util.debug("Error generating temporary output file name");
						cb(null,err1);
					} else {
						progArguments.push(fh_input.path);
						progArguments.push(fh_output.path);
						saturn.core.Util.inspect(progArguments);
						saturn.core.Util.print(program);
						var p = js.Node.require("child_process").spawn(program,progArguments);
						p.stderr.on("data",function(data) {
							saturn.core.Util.debug(data.toString());
						});
						p.stdout.on("data",function(data1) {
							saturn.core.Util.debug(data1.toString());
						});
						p.on("close",function(retVal) {
							if(retVal == "0") {
								var jsonStr = js.Node.require("fs").readFileSync(fh_output.path,{ encoding : "utf8"});
								js.Node.require("fs").unlinkSync(fh_output.path);
								js.Node.require("fs").unlinkSync(fh_input.path);
								var jsonObj = JSON.parse(jsonStr);
								var error = null;
								if(Object.prototype.hasOwnProperty.call(jsonObj,"error")) error = Reflect.field(jsonObj,"error");
								cb([jsonObj],error);
							} else {
								saturn.core.Util.debug("External process has failed");
								cb(null,"External process returned a non-zero exit status");
							}
						});
					}
				});
			};
			var fields = Reflect.fields(config);
			var next = null;
			next = function() {
				if(fields.length == 0) run(); else {
					var field = fields.pop();
					if(field.indexOf("upload_key") == 0) {
						saturn.core.Util.debug("Found upload key");
						var saturn1 = saturn.app.SaturnServer.getDefaultServer();
						var redis = saturn1.getRedisClient();
						var upload_key = Reflect.field(config,field);
						var path1 = redis.get(upload_key,function(err2,path) {
							if(path == null) {
								cb(null,"Invalid file upload key " + upload_key);
								return;
							} else {
								config[field] = path;
								next();
							}
						});
					} else if(field.indexOf("out_file") == 0) {
						var saturn2 = saturn.app.SaturnServer.getDefaultServer();
						var baseFolder = saturn2.getRelativePublicOuputFolder();
						config[field] = baseFolder;
						next();
					} else next();
				}
			};
			next();
		}
	});
};
saturn.db.provider.hooks.RawSQLHook = $hxClasses["saturn.db.provider.hooks.RawSQLHook"] = function() { };
saturn.db.provider.hooks.RawSQLHook.__name__ = ["saturn","db","provider","hooks","RawSQLHook"];
saturn.db.provider.hooks.RawSQLHook.run = function(query,params,clazz,cb,hookConfig) {
	var sql = params[0];
	var args = params[1];
	saturn.core.Util.getProvider().getConnection(null,function(err,conn) {
		conn.execute(sql,args,function(err1,results) {
			cb(results,err1);
		});
	});
};
if(!saturn.db.query_lang) saturn.db.query_lang = {};
saturn.db.query_lang.Token = $hxClasses["saturn.db.query_lang.Token"] = function(tokens) {
	this.tokens = tokens;
	if(this.tokens != null) {
		var _g1 = 0;
		var _g = this.tokens.length;
		while(_g1 < _g) {
			var i = _g1++;
			var value = this.tokens[i];
			if(value != null) {
				if(!js.Boot.__instanceof(value,saturn.db.query_lang.Token)) this.tokens[i] = new saturn.db.query_lang.Value(value);
			}
		}
	}
};
saturn.db.query_lang.Token.__name__ = ["saturn","db","query_lang","Token"];
saturn.db.query_lang.Token.prototype = {
	tokens: null
	,name: null
	,'as': function(name) {
		this.name = name;
		return this;
	}
	,getTokens: function() {
		return this.tokens;
	}
	,setTokens: function(tokens) {
		this.tokens = tokens;
	}
	,addToken: function(token) {
		if(!js.Boot.__instanceof(token,saturn.db.query_lang.Token)) token = new saturn.db.query_lang.Value(saturn.db.query_lang.Token);
		if(this.tokens == null) this.tokens = [];
		this.tokens.push(token);
		return this;
	}
	,field: function(clazz,attributeName,clazzAlias) {
		var f = new saturn.db.query_lang.Field(clazz,attributeName,clazzAlias);
		this.add(f);
		return f;
	}
	,add: function(token) {
		if(js.Boot.__instanceof(token,saturn.db.query_lang.Operator)) {
			var n = new saturn.db.query_lang.Token();
			n.add(this);
			n.addToken(token);
			return n;
		} else return this.addToken(token);
	}
	,removeToken: function(token) {
		HxOverrides.remove(this.tokens,token);
	}
	,like: function(token) {
		var l = new saturn.db.query_lang.Like();
		if(token != null) l.add(token);
		return this.add(l);
	}
	,concat: function(token) {
		var c = new saturn.db.query_lang.Concat([this,token]);
		return c;
	}
	,substr: function(position,length) {
		return new saturn.db.query_lang.Substr(this,position,length);
	}
	,instr: function(substring,position,occurrence) {
		return new saturn.db.query_lang.Instr(this,substring,position,occurrence);
	}
	,max: function() {
		return new saturn.db.query_lang.Max(this);
	}
	,length: function() {
		return new saturn.db.query_lang.Length(this);
	}
	,plus: function(token) {
		var c = new saturn.db.query_lang.Plus(token);
		return this.add(c);
	}
	,minus: function(token) {
		var c = new saturn.db.query_lang.Minus(token);
		return this.add(c);
	}
	,getClassList: function() {
		var list = [];
		var tokens = this.getTokens();
		if(tokens != null && tokens.length > 0) {
			var _g = 0;
			while(_g < tokens.length) {
				var token = tokens[_g];
				++_g;
				if(js.Boot.__instanceof(token,saturn.db.query_lang.ClassToken)) {
					var cToken;
					cToken = js.Boot.__cast(token , saturn.db.query_lang.ClassToken);
					if(cToken.getClass() != null) list.push(cToken.getClass());
				} else {
					var list2 = token.getClassList();
					var _g1 = 0;
					while(_g1 < list2.length) {
						var item = list2[_g1];
						++_g1;
						list.push(item);
					}
				}
			}
		}
		return list;
	}
	,or: function() {
		this.add(new saturn.db.query_lang.Or());
	}
	,__class__: saturn.db.query_lang.Token
};
saturn.db.query_lang.Operator = $hxClasses["saturn.db.query_lang.Operator"] = function(token) {
	if(token != null) saturn.db.query_lang.Token.call(this,[token]); else saturn.db.query_lang.Token.call(this,null);
};
saturn.db.query_lang.Operator.__name__ = ["saturn","db","query_lang","Operator"];
saturn.db.query_lang.Operator.__super__ = saturn.db.query_lang.Token;
saturn.db.query_lang.Operator.prototype = $extend(saturn.db.query_lang.Token.prototype,{
	__class__: saturn.db.query_lang.Operator
});
saturn.db.query_lang.And = $hxClasses["saturn.db.query_lang.And"] = function() {
	saturn.db.query_lang.Operator.call(this,null);
};
saturn.db.query_lang.And.__name__ = ["saturn","db","query_lang","And"];
saturn.db.query_lang.And.__super__ = saturn.db.query_lang.Operator;
saturn.db.query_lang.And.prototype = $extend(saturn.db.query_lang.Operator.prototype,{
	__class__: saturn.db.query_lang.And
});
saturn.db.query_lang.Function = $hxClasses["saturn.db.query_lang.Function"] = function(tokens) {
	saturn.db.query_lang.Token.call(this,tokens);
};
saturn.db.query_lang.Function.__name__ = ["saturn","db","query_lang","Function"];
saturn.db.query_lang.Function.__super__ = saturn.db.query_lang.Token;
saturn.db.query_lang.Function.prototype = $extend(saturn.db.query_lang.Token.prototype,{
	__class__: saturn.db.query_lang.Function
});
saturn.db.query_lang.Cast = $hxClasses["saturn.db.query_lang.Cast"] = function(expression,type) {
	saturn.db.query_lang.Function.call(this,[expression,type]);
};
saturn.db.query_lang.Cast.__name__ = ["saturn","db","query_lang","Cast"];
saturn.db.query_lang.Cast.__super__ = saturn.db.query_lang.Function;
saturn.db.query_lang.Cast.prototype = $extend(saturn.db.query_lang.Function.prototype,{
	__class__: saturn.db.query_lang.Cast
});
saturn.db.query_lang.CastAsInt = $hxClasses["saturn.db.query_lang.CastAsInt"] = function(token) {
	saturn.db.query_lang.Function.call(this,[token]);
};
saturn.db.query_lang.CastAsInt.__name__ = ["saturn","db","query_lang","CastAsInt"];
saturn.db.query_lang.CastAsInt.__super__ = saturn.db.query_lang.Function;
saturn.db.query_lang.CastAsInt.prototype = $extend(saturn.db.query_lang.Function.prototype,{
	__class__: saturn.db.query_lang.CastAsInt
});
saturn.db.query_lang.ClassToken = $hxClasses["saturn.db.query_lang.ClassToken"] = function(clazz) {
	this.setClass(clazz);
	saturn.db.query_lang.Token.call(this,null);
};
saturn.db.query_lang.ClassToken.__name__ = ["saturn","db","query_lang","ClassToken"];
saturn.db.query_lang.ClassToken.__super__ = saturn.db.query_lang.Token;
saturn.db.query_lang.ClassToken.prototype = $extend(saturn.db.query_lang.Token.prototype,{
	clazz: null
	,getClass: function() {
		return this.clazz;
	}
	,setClass: function(clazz) {
		if(js.Boot.__instanceof(clazz,Class)) {
			var c;
			c = js.Boot.__cast(clazz , Class);
			this.clazz = Type.getClassName(c);
		} else this.clazz = clazz;
	}
	,__class__: saturn.db.query_lang.ClassToken
});
saturn.db.query_lang.Concat = $hxClasses["saturn.db.query_lang.Concat"] = function(tokens) {
	saturn.db.query_lang.Function.call(this,tokens);
};
saturn.db.query_lang.Concat.__name__ = ["saturn","db","query_lang","Concat"];
saturn.db.query_lang.Concat.__super__ = saturn.db.query_lang.Function;
saturn.db.query_lang.Concat.prototype = $extend(saturn.db.query_lang.Function.prototype,{
	__class__: saturn.db.query_lang.Concat
});
saturn.db.query_lang.ConcatOperator = $hxClasses["saturn.db.query_lang.ConcatOperator"] = function(token) {
	saturn.db.query_lang.Operator.call(this,token);
};
saturn.db.query_lang.ConcatOperator.__name__ = ["saturn","db","query_lang","ConcatOperator"];
saturn.db.query_lang.ConcatOperator.__super__ = saturn.db.query_lang.Operator;
saturn.db.query_lang.ConcatOperator.prototype = $extend(saturn.db.query_lang.Operator.prototype,{
	__class__: saturn.db.query_lang.ConcatOperator
});
saturn.db.query_lang.Count = $hxClasses["saturn.db.query_lang.Count"] = function(token) {
	saturn.db.query_lang.Function.call(this,[token]);
};
saturn.db.query_lang.Count.__name__ = ["saturn","db","query_lang","Count"];
saturn.db.query_lang.Count.__super__ = saturn.db.query_lang.Function;
saturn.db.query_lang.Count.prototype = $extend(saturn.db.query_lang.Function.prototype,{
	__class__: saturn.db.query_lang.Count
});
saturn.db.query_lang.EndBlock = $hxClasses["saturn.db.query_lang.EndBlock"] = function() {
	saturn.db.query_lang.Token.call(this,null);
};
saturn.db.query_lang.EndBlock.__name__ = ["saturn","db","query_lang","EndBlock"];
saturn.db.query_lang.EndBlock.__super__ = saturn.db.query_lang.Token;
saturn.db.query_lang.EndBlock.prototype = $extend(saturn.db.query_lang.Token.prototype,{
	__class__: saturn.db.query_lang.EndBlock
});
saturn.db.query_lang.Equals = $hxClasses["saturn.db.query_lang.Equals"] = function(token) {
	saturn.db.query_lang.Operator.call(this,token);
};
saturn.db.query_lang.Equals.__name__ = ["saturn","db","query_lang","Equals"];
saturn.db.query_lang.Equals.__super__ = saturn.db.query_lang.Operator;
saturn.db.query_lang.Equals.prototype = $extend(saturn.db.query_lang.Operator.prototype,{
	__class__: saturn.db.query_lang.Equals
});
saturn.db.query_lang.Field = $hxClasses["saturn.db.query_lang.Field"] = function(clazz,attributeName,clazzAlias) {
	this.setClass(clazz);
	this.attributeName = attributeName;
	this.clazzAlias = clazzAlias;
	saturn.db.query_lang.Token.call(this,null);
};
saturn.db.query_lang.Field.__name__ = ["saturn","db","query_lang","Field"];
saturn.db.query_lang.Field.__super__ = saturn.db.query_lang.Token;
saturn.db.query_lang.Field.prototype = $extend(saturn.db.query_lang.Token.prototype,{
	clazz: null
	,clazzAlias: null
	,attributeName: null
	,getClass: function() {
		return this.clazz;
	}
	,setClass: function(clazz) {
		if(js.Boot.__instanceof(clazz,Class)) {
			var c;
			c = js.Boot.__cast(clazz , Class);
			this.clazz = Type.getClassName(c);
		} else this.clazz = clazz;
	}
	,getAttributeName: function() {
		return this.attributeName;
	}
	,setAttributeName: function(name) {
		this.attributeName = name;
	}
	,__class__: saturn.db.query_lang.Field
});
saturn.db.query_lang.From = $hxClasses["saturn.db.query_lang.From"] = function() {
	saturn.db.query_lang.Token.call(this,null);
};
saturn.db.query_lang.From.__name__ = ["saturn","db","query_lang","From"];
saturn.db.query_lang.From.__super__ = saturn.db.query_lang.Token;
saturn.db.query_lang.From.prototype = $extend(saturn.db.query_lang.Token.prototype,{
	__class__: saturn.db.query_lang.From
});
saturn.db.query_lang.GreaterThan = $hxClasses["saturn.db.query_lang.GreaterThan"] = function(token) {
	saturn.db.query_lang.Operator.call(this,token);
};
saturn.db.query_lang.GreaterThan.__name__ = ["saturn","db","query_lang","GreaterThan"];
saturn.db.query_lang.GreaterThan.__super__ = saturn.db.query_lang.Operator;
saturn.db.query_lang.GreaterThan.prototype = $extend(saturn.db.query_lang.Operator.prototype,{
	__class__: saturn.db.query_lang.GreaterThan
});
saturn.db.query_lang.GreaterThanOrEqualTo = $hxClasses["saturn.db.query_lang.GreaterThanOrEqualTo"] = function(token) {
	saturn.db.query_lang.Operator.call(this,token);
};
saturn.db.query_lang.GreaterThanOrEqualTo.__name__ = ["saturn","db","query_lang","GreaterThanOrEqualTo"];
saturn.db.query_lang.GreaterThanOrEqualTo.__super__ = saturn.db.query_lang.Operator;
saturn.db.query_lang.GreaterThanOrEqualTo.prototype = $extend(saturn.db.query_lang.Operator.prototype,{
	__class__: saturn.db.query_lang.GreaterThanOrEqualTo
});
saturn.db.query_lang.Group = $hxClasses["saturn.db.query_lang.Group"] = function() {
	saturn.db.query_lang.Token.call(this,null);
};
saturn.db.query_lang.Group.__name__ = ["saturn","db","query_lang","Group"];
saturn.db.query_lang.Group.__super__ = saturn.db.query_lang.Token;
saturn.db.query_lang.Group.prototype = $extend(saturn.db.query_lang.Token.prototype,{
	__class__: saturn.db.query_lang.Group
});
saturn.db.query_lang.In = $hxClasses["saturn.db.query_lang.In"] = function(token) {
	saturn.db.query_lang.Operator.call(this,token);
};
saturn.db.query_lang.In.__name__ = ["saturn","db","query_lang","In"];
saturn.db.query_lang.In.__super__ = saturn.db.query_lang.Operator;
saturn.db.query_lang.In.prototype = $extend(saturn.db.query_lang.Operator.prototype,{
	__class__: saturn.db.query_lang.In
});
saturn.db.query_lang.Instr = $hxClasses["saturn.db.query_lang.Instr"] = function(value,substring,position,occurrence) {
	if(position == null) position = new saturn.db.query_lang.Value(1);
	if(occurrence == null) occurrence = new saturn.db.query_lang.Value(1);
	saturn.db.query_lang.Function.call(this,[value,substring,position,occurrence]);
};
saturn.db.query_lang.Instr.__name__ = ["saturn","db","query_lang","Instr"];
saturn.db.query_lang.Instr.__super__ = saturn.db.query_lang.Function;
saturn.db.query_lang.Instr.prototype = $extend(saturn.db.query_lang.Function.prototype,{
	__class__: saturn.db.query_lang.Instr
});
saturn.db.query_lang.IsNotNull = $hxClasses["saturn.db.query_lang.IsNotNull"] = function() {
	saturn.db.query_lang.Operator.call(this,null);
};
saturn.db.query_lang.IsNotNull.__name__ = ["saturn","db","query_lang","IsNotNull"];
saturn.db.query_lang.IsNotNull.__super__ = saturn.db.query_lang.Operator;
saturn.db.query_lang.IsNotNull.prototype = $extend(saturn.db.query_lang.Operator.prototype,{
	__class__: saturn.db.query_lang.IsNotNull
});
saturn.db.query_lang.IsNull = $hxClasses["saturn.db.query_lang.IsNull"] = function() {
	this.empty = "NULL";
	saturn.db.query_lang.Operator.call(this,null);
};
saturn.db.query_lang.IsNull.__name__ = ["saturn","db","query_lang","IsNull"];
saturn.db.query_lang.IsNull.__super__ = saturn.db.query_lang.Operator;
saturn.db.query_lang.IsNull.prototype = $extend(saturn.db.query_lang.Operator.prototype,{
	empty: null
	,__class__: saturn.db.query_lang.IsNull
});
saturn.db.query_lang.Length = $hxClasses["saturn.db.query_lang.Length"] = function(value) {
	saturn.db.query_lang.Function.call(this,[value]);
};
saturn.db.query_lang.Length.__name__ = ["saturn","db","query_lang","Length"];
saturn.db.query_lang.Length.__super__ = saturn.db.query_lang.Function;
saturn.db.query_lang.Length.prototype = $extend(saturn.db.query_lang.Function.prototype,{
	__class__: saturn.db.query_lang.Length
});
saturn.db.query_lang.LessThan = $hxClasses["saturn.db.query_lang.LessThan"] = function(token) {
	saturn.db.query_lang.Operator.call(this,token);
};
saturn.db.query_lang.LessThan.__name__ = ["saturn","db","query_lang","LessThan"];
saturn.db.query_lang.LessThan.__super__ = saturn.db.query_lang.Operator;
saturn.db.query_lang.LessThan.prototype = $extend(saturn.db.query_lang.Operator.prototype,{
	__class__: saturn.db.query_lang.LessThan
});
saturn.db.query_lang.LessThanOrEqualTo = $hxClasses["saturn.db.query_lang.LessThanOrEqualTo"] = function(token) {
	saturn.db.query_lang.Operator.call(this,token);
};
saturn.db.query_lang.LessThanOrEqualTo.__name__ = ["saturn","db","query_lang","LessThanOrEqualTo"];
saturn.db.query_lang.LessThanOrEqualTo.__super__ = saturn.db.query_lang.Operator;
saturn.db.query_lang.LessThanOrEqualTo.prototype = $extend(saturn.db.query_lang.Operator.prototype,{
	__class__: saturn.db.query_lang.LessThanOrEqualTo
});
saturn.db.query_lang.Like = $hxClasses["saturn.db.query_lang.Like"] = function() {
	saturn.db.query_lang.Operator.call(this,null);
};
saturn.db.query_lang.Like.__name__ = ["saturn","db","query_lang","Like"];
saturn.db.query_lang.Like.__super__ = saturn.db.query_lang.Operator;
saturn.db.query_lang.Like.prototype = $extend(saturn.db.query_lang.Operator.prototype,{
	__class__: saturn.db.query_lang.Like
});
saturn.db.query_lang.Limit = $hxClasses["saturn.db.query_lang.Limit"] = function(limit) {
	saturn.db.query_lang.Token.call(this,[limit]);
};
saturn.db.query_lang.Limit.__name__ = ["saturn","db","query_lang","Limit"];
saturn.db.query_lang.Limit.__super__ = saturn.db.query_lang.Token;
saturn.db.query_lang.Limit.prototype = $extend(saturn.db.query_lang.Token.prototype,{
	__class__: saturn.db.query_lang.Limit
});
saturn.db.query_lang.Max = $hxClasses["saturn.db.query_lang.Max"] = function(value) {
	saturn.db.query_lang.Function.call(this,[value]);
};
saturn.db.query_lang.Max.__name__ = ["saturn","db","query_lang","Max"];
saturn.db.query_lang.Max.__super__ = saturn.db.query_lang.Function;
saturn.db.query_lang.Max.prototype = $extend(saturn.db.query_lang.Function.prototype,{
	__class__: saturn.db.query_lang.Max
});
saturn.db.query_lang.Minus = $hxClasses["saturn.db.query_lang.Minus"] = function(value) {
	if(value == null) saturn.db.query_lang.Operator.call(this,null); else saturn.db.query_lang.Operator.call(this,value);
};
saturn.db.query_lang.Minus.__name__ = ["saturn","db","query_lang","Minus"];
saturn.db.query_lang.Minus.__super__ = saturn.db.query_lang.Operator;
saturn.db.query_lang.Minus.prototype = $extend(saturn.db.query_lang.Operator.prototype,{
	__class__: saturn.db.query_lang.Minus
});
saturn.db.query_lang.NotEquals = $hxClasses["saturn.db.query_lang.NotEquals"] = function(token) {
	saturn.db.query_lang.Operator.call(this,token);
};
saturn.db.query_lang.NotEquals.__name__ = ["saturn","db","query_lang","NotEquals"];
saturn.db.query_lang.NotEquals.__super__ = saturn.db.query_lang.Operator;
saturn.db.query_lang.NotEquals.prototype = $extend(saturn.db.query_lang.Operator.prototype,{
	__class__: saturn.db.query_lang.NotEquals
});
saturn.db.query_lang.Or = $hxClasses["saturn.db.query_lang.Or"] = function() {
	saturn.db.query_lang.Operator.call(this,null);
};
saturn.db.query_lang.Or.__name__ = ["saturn","db","query_lang","Or"];
saturn.db.query_lang.Or.__super__ = saturn.db.query_lang.Operator;
saturn.db.query_lang.Or.prototype = $extend(saturn.db.query_lang.Operator.prototype,{
	__class__: saturn.db.query_lang.Or
});
saturn.db.query_lang.OrderBy = $hxClasses["saturn.db.query_lang.OrderBy"] = function() {
	saturn.db.query_lang.Token.call(this,null);
};
saturn.db.query_lang.OrderBy.__name__ = ["saturn","db","query_lang","OrderBy"];
saturn.db.query_lang.OrderBy.__super__ = saturn.db.query_lang.Token;
saturn.db.query_lang.OrderBy.prototype = $extend(saturn.db.query_lang.Token.prototype,{
	__class__: saturn.db.query_lang.OrderBy
});
saturn.db.query_lang.OrderByItem = $hxClasses["saturn.db.query_lang.OrderByItem"] = function(token,descending) {
	if(descending == null) descending = false;
	this.descending = false;
	this.descending = descending;
	saturn.db.query_lang.Token.call(this,[token]);
};
saturn.db.query_lang.OrderByItem.__name__ = ["saturn","db","query_lang","OrderByItem"];
saturn.db.query_lang.OrderByItem.__super__ = saturn.db.query_lang.Token;
saturn.db.query_lang.OrderByItem.prototype = $extend(saturn.db.query_lang.Token.prototype,{
	descending: null
	,__class__: saturn.db.query_lang.OrderByItem
});
saturn.db.query_lang.Plus = $hxClasses["saturn.db.query_lang.Plus"] = function(value) {
	if(value == null) saturn.db.query_lang.Operator.call(this,null); else saturn.db.query_lang.Operator.call(this,value);
};
saturn.db.query_lang.Plus.__name__ = ["saturn","db","query_lang","Plus"];
saturn.db.query_lang.Plus.__super__ = saturn.db.query_lang.Operator;
saturn.db.query_lang.Plus.prototype = $extend(saturn.db.query_lang.Operator.prototype,{
	__class__: saturn.db.query_lang.Plus
});
saturn.db.query_lang.Query = $hxClasses["saturn.db.query_lang.Query"] = function(provider) {
	saturn.db.query_lang.Token.call(this,null);
	this.provider = provider;
	this.selectToken = new saturn.db.query_lang.Select();
	this.whereToken = new saturn.db.query_lang.Where();
	this.fromToken = new saturn.db.query_lang.From();
	this.groupToken = new saturn.db.query_lang.Group();
	this.orderToken = new saturn.db.query_lang.OrderBy();
};
saturn.db.query_lang.Query.__name__ = ["saturn","db","query_lang","Query"];
saturn.db.query_lang.Query.deserialise = function(querySer) {
	var clone = haxe.Unserializer.run(querySer);
	saturn.db.query_lang.Query.deserialiseToken(clone);
	return clone;
};
saturn.db.query_lang.Query.deserialiseToken = function(token) {
	if(token == null) return;
	if(token.getTokens() != null) {
		var _g = 0;
		var _g1 = token.getTokens();
		while(_g < _g1.length) {
			var token1 = _g1[_g];
			++_g;
			saturn.db.query_lang.Query.deserialiseToken(token1);
		}
	}
	if(js.Boot.__instanceof(token,saturn.db.query_lang.Query)) {
		var qToken;
		qToken = js.Boot.__cast(token , saturn.db.query_lang.Query);
		qToken.provider = null;
	}
};
saturn.db.query_lang.Query.startsWith = function(value) {
	var t = new saturn.db.query_lang.Like();
	t.add(new saturn.db.query_lang.Value(value).concat("%"));
	return t;
};
saturn.db.query_lang.Query.getByExample = function(provider,example,cb) {
	var q = new saturn.db.query_lang.Query(provider);
	q.addExample(example);
	q.run(cb);
	return q;
};
saturn.db.query_lang.Query.__super__ = saturn.db.query_lang.Token;
saturn.db.query_lang.Query.prototype = $extend(saturn.db.query_lang.Token.prototype,{
	selectToken: null
	,fromToken: null
	,whereToken: null
	,groupToken: null
	,orderToken: null
	,provider: null
	,rawResults: null
	,pageOn: null
	,pageSize: null
	,lastPagedRowValue: null
	,results: null
	,error: null
	,setPageOnToken: function(t) {
		this.pageOn = t;
	}
	,getPageOnToken: function() {
		return this.pageOn;
	}
	,setLastPagedRowValue: function(t) {
		this.lastPagedRowValue = t;
	}
	,getLastPagedRowValue: function() {
		return this.lastPagedRowValue;
	}
	,setPageSize: function(t) {
		this.pageSize = t;
	}
	,getPageSize: function() {
		return this.pageSize;
	}
	,isPaging: function() {
		return this.pageOn != null && this.pageSize != null;
	}
	,configurePaging: function(pageOn,pageSize) {
		this.pageOn = pageOn;
		this.pageSize = pageSize;
	}
	,fetchRawResults: function() {
		this.rawResults = true;
	}
	,bindResults: function() {
		return !this.rawResults;
	}
	,getTokens: function() {
		var tokens = [];
		var checkTokens = [this.selectToken,this.whereToken];
		var _g = 0;
		while(_g < checkTokens.length) {
			var token = checkTokens[_g];
			++_g;
			this.addClassToken(token);
		}
		if(this.fromToken.getTokens() != null) {
			var seen = new haxe.ds.StringMap();
			var tokens1 = [];
			var _g1 = 0;
			var _g11 = this.fromToken.getTokens();
			while(_g1 < _g11.length) {
				var token1 = _g11[_g1];
				++_g1;
				if(js.Boot.__instanceof(token1,saturn.db.query_lang.ClassToken)) {
					var cToken;
					cToken = js.Boot.__cast(token1 , saturn.db.query_lang.ClassToken);
					if(cToken.getClass() != null) {
						var clazzName = cToken.getClass();
						if(!(__map_reserved[clazzName] != null?seen.existsReserved(clazzName):seen.h.hasOwnProperty(clazzName))) {
							tokens1.push(cToken);
							if(__map_reserved[clazzName] != null) seen.setReserved(clazzName,""); else seen.h[clazzName] = "";
						}
					} else tokens1.push(cToken);
				} else tokens1.push(token1);
			}
			this.fromToken.setTokens(tokens1);
			saturn.core.Util.print("Num targets" + this.fromToken.getTokens().length);
		}
		tokens.push(this.selectToken);
		tokens.push(this.fromToken);
		if(this.whereToken.getTokens() != null && this.whereToken.getTokens().length > 0) {
			tokens.push(this.whereToken);
			if(this.isPaging() && this.lastPagedRowValue != null) {
				tokens.push(new saturn.db.query_lang.And());
				tokens.push(this.pageOn);
				tokens.push(new saturn.db.query_lang.GreaterThan());
				tokens.push(this.lastPagedRowValue);
			}
		}
		if(this.groupToken.getTokens() != null && this.groupToken.getTokens().length > 0) tokens.push(this.groupToken);
		if(this.orderToken.getTokens() != null && this.orderToken.getTokens().length > 0) tokens.push(this.orderToken);
		if(this.isPaging()) {
			tokens.push(new saturn.db.query_lang.OrderBy());
			tokens.push(new saturn.db.query_lang.OrderByItem(this.pageOn));
			tokens.push(new saturn.db.query_lang.Limit(this.pageSize));
		}
		if(this.tokens != null && this.tokens.length > 0) {
			var _g2 = 0;
			var _g12 = this.tokens;
			while(_g2 < _g12.length) {
				var token2 = _g12[_g2];
				++_g2;
				tokens.push(token2);
			}
		}
		return tokens;
	}
	,or: function() {
		this.getWhere().addToken(new saturn.db.query_lang.Or());
	}
	,and: function() {
		this.getWhere().addToken(new saturn.db.query_lang.And());
	}
	,equals: function(clazz,field,value) {
		this.getWhere().addToken(new saturn.db.query_lang.Field(clazz,field));
		this.getWhere().addToken(new saturn.db.query_lang.Equals());
		this.getWhere().addToken(new saturn.db.query_lang.Value(value));
	}
	,select: function(clazz,field) {
		this.getSelect().addToken(new saturn.db.query_lang.Field(clazz,field));
	}
	,getSelect: function() {
		return this.selectToken;
	}
	,getFrom: function() {
		return this.fromToken;
	}
	,getWhere: function() {
		return this.whereToken;
	}
	,getGroup: function() {
		return this.groupToken;
	}
	,clone: function() {
		var str = this.serialise();
		return saturn.db.query_lang.Query.deserialise(str);
	}
	,serialise: function() {
		var keepMe = this.provider;
		this.provider = null;
		var newMe = haxe.Serializer.run(this);
		this.provider = keepMe;
		return newMe;
	}
	,__getstate__: function() {
		var state = Syntax.pythonCode("dict(self.__dict__)");
		Syntax.pythonCode("del state['provider']");
		return state;
	}
	,run: function(cb) {
		var _g = this;
		var clone = this.clone();
		clone.provider = null;
		clone.getTokens();
		this.provider.query(clone,function(objs,err) {
			if(err == null && objs.length > 0 && _g.isPaging()) {
				var fieldName = null;
				if(_g.pageOn.name != null) fieldName = _g.pageOn.name; else if(js.Boot.__instanceof(_g.pageOn,saturn.db.query_lang.Field)) {
					var fToken;
					fToken = js.Boot.__cast(_g.pageOn , saturn.db.query_lang.Field);
					fieldName = fToken.getAttributeName();
				}
				if(fieldName == null) err = "Unable to determine value of last paged row"; else _g.setLastPagedRowValue(new saturn.db.query_lang.Value(Reflect.field(objs[objs.length - 1],fieldName)));
			}
			_g.results = objs;
			_g.error = err;
			if(cb != null) cb(objs,err);
		});
	}
	,getSelectClassList: function() {
		var set = new haxe.ds.StringMap();
		var _g = 0;
		var _g1 = this.selectToken.getTokens();
		while(_g < _g1.length) {
			var token = _g1[_g];
			++_g;
			if(js.Boot.__instanceof(token,saturn.db.query_lang.Field)) {
				var cToken;
				cToken = js.Boot.__cast(token , saturn.db.query_lang.Field);
				var clazz = cToken.getClass();
				if(clazz != null) {
					if(__map_reserved[clazz] != null) set.setReserved(clazz,clazz); else set.h[clazz] = clazz;
				}
			}
		}
		var list = [];
		var $it0 = set.keys();
		while( $it0.hasNext() ) {
			var className = $it0.next();
			list.push(__map_reserved[className] != null?set.getReserved(className):set.h[className]);
		}
		return list;
	}
	,unbindFields: function(token) {
		if(token == null) return;
		if(js.Boot.__instanceof(token,saturn.db.query_lang.Field)) {
			var cToken;
			cToken = js.Boot.__cast(token , saturn.db.query_lang.Field);
			var clazz = cToken.getClass();
			var field = cToken.getAttributeName();
			var model = this.provider.getModelByStringName(clazz);
			if(model != null) {
				if(field != "*") {
					var unboundFieldName = model.unbindFieldName(field);
					cToken.setAttributeName(unboundFieldName);
				}
			}
		}
		if(token.getTokens() != null) {
			var _g = 0;
			var _g1 = token.getTokens();
			while(_g < _g1.length) {
				var token1 = _g1[_g];
				++_g;
				this.unbindFields(token1);
			}
		}
	}
	,addClassToken: function(token) {
		if(js.Boot.__instanceof(token,saturn.db.query_lang.Query) || token == null) return;
		if(js.Boot.__instanceof(token,saturn.db.query_lang.Field)) {
			var fToken;
			fToken = js.Boot.__cast(token , saturn.db.query_lang.Field);
			if(fToken.getClass() != null) {
				var cToken = new saturn.db.query_lang.ClassToken(fToken.getClass());
				if(fToken.clazzAlias != null) cToken.name = fToken.clazzAlias;
				this.fromToken.addToken(cToken);
			}
		}
		if(token.getTokens() != null) {
			var _g = 0;
			var _g1 = token.getTokens();
			while(_g < _g1.length) {
				var token1 = _g1[_g];
				++_g;
				this.addClassToken(token1);
			}
		}
	}
	,addExample: function(obj,fieldList) {
		var clazz = Type.getClass(obj);
		var model = this.provider.getModel(clazz);
		if(fieldList != null) {
			if(fieldList.length > 0) {
				var _g = 0;
				while(_g < fieldList.length) {
					var field = fieldList[_g];
					++_g;
					this.getSelect().addToken(new saturn.db.query_lang.Field(clazz,field));
				}
			}
		} else this.getSelect().addToken(new saturn.db.query_lang.Field(clazz,"*"));
		var fields = model.getAttributes();
		var hasPrevious = false;
		this.getWhere().addToken(new saturn.db.query_lang.StartBlock());
		var _g1 = 0;
		var _g2 = fields.length;
		while(_g1 < _g2) {
			var i = _g1++;
			var field1 = fields[i];
			var value = Reflect.field(obj,field1);
			if(value != null) {
				if(hasPrevious) this.getWhere().addToken(new saturn.db.query_lang.And());
				var fieldToken = new saturn.db.query_lang.Field(clazz,field1);
				this.getWhere().addToken(fieldToken);
				if(js.Boot.__instanceof(value,saturn.db.query_lang.IsNull)) {
					saturn.core.Util.print("Found NULL");
					this.getWhere().addToken(new saturn.db.query_lang.IsNull());
				} else if(js.Boot.__instanceof(value,saturn.db.query_lang.IsNotNull)) this.getWhere().addToken(new saturn.db.query_lang.IsNotNull()); else if(js.Boot.__instanceof(value,saturn.db.query_lang.Operator)) this.getWhere().addToken(value); else {
					this.getWhere().addToken(new saturn.db.query_lang.Equals());
					if(js.Boot.__instanceof(value,saturn.db.query_lang.Token)) this.getWhere().addToken(value); else {
						saturn.core.Util.print("Found value" + Type.getClassName(value == null?null:js.Boot.getClass(value)));
						this.getWhere().addToken(new saturn.db.query_lang.Value(value));
					}
				}
				hasPrevious = true;
			}
		}
		this.getWhere().addToken(new saturn.db.query_lang.EndBlock());
	}
	,getResults: function() {
		return this.results;
	}
	,hasResults: function() {
		return this.results != null && this.results.length > 0;
	}
	,getError: function() {
		return this.error;
	}
	,__class__: saturn.db.query_lang.Query
});
saturn.db.query_lang.QueryTests = $hxClasses["saturn.db.query_lang.QueryTests"] = function() {
};
saturn.db.query_lang.QueryTests.__name__ = ["saturn","db","query_lang","QueryTests"];
saturn.db.query_lang.QueryTests.prototype = {
	test1: function() {
		var query = new saturn.db.query_lang.Query(saturn.core.Util.getProvider());
		query.getSelect().addToken(new saturn.db.query_lang.Field(saturn.core.domain.SgcAllele,"alleleId",null));
		var visitor = new saturn.db.query_lang.SQLVisitor(saturn.core.Util.getProvider());
		visitor.translate(query);
	}
	,__class__: saturn.db.query_lang.QueryTests
};
saturn.db.query_lang.QueryVisitor = $hxClasses["saturn.db.query_lang.QueryVisitor"] = function() { };
saturn.db.query_lang.QueryVisitor.__name__ = ["saturn","db","query_lang","QueryVisitor"];
saturn.db.query_lang.QueryVisitor.prototype = {
	translateQuery: null
	,__class__: saturn.db.query_lang.QueryVisitor
};
saturn.db.query_lang.RegexpLike = $hxClasses["saturn.db.query_lang.RegexpLike"] = function(field,expression) {
	saturn.db.query_lang.Function.call(this,[field,expression]);
};
saturn.db.query_lang.RegexpLike.__name__ = ["saturn","db","query_lang","RegexpLike"];
saturn.db.query_lang.RegexpLike.__super__ = saturn.db.query_lang.Function;
saturn.db.query_lang.RegexpLike.prototype = $extend(saturn.db.query_lang.Function.prototype,{
	__class__: saturn.db.query_lang.RegexpLike
});
saturn.db.query_lang.SQLVisitor = $hxClasses["saturn.db.query_lang.SQLVisitor"] = function(provider,valPos,aliasToGenerated,nextAliasId) {
	if(nextAliasId == null) nextAliasId = 0;
	if(valPos == null) valPos = 1;
	this.provider = provider;
	this.values = [];
	this.valPos = valPos;
	if(aliasToGenerated == null) this.aliasToGenerated = new haxe.ds.StringMap(); else this.aliasToGenerated = aliasToGenerated;
	this.nextAliasId = nextAliasId;
};
saturn.db.query_lang.SQLVisitor.__name__ = ["saturn","db","query_lang","SQLVisitor"];
saturn.db.query_lang.SQLVisitor.prototype = {
	provider: null
	,values: null
	,valPos: null
	,nextAliasId: null
	,aliasToGenerated: null
	,generatedToAlias: null
	,generateId: function(alias,baseValue) {
		if(baseValue == null) baseValue = "ALIAS_";
		if(this.aliasToGenerated.exists(alias)) return this.aliasToGenerated.get(alias);
		this.nextAliasId++;
		var id = baseValue + this.nextAliasId;
		this.aliasToGenerated.set(alias,id);
		saturn.core.Util.debug("Mapping" + alias + " to  " + id);
		return id;
	}
	,getNextValuePosition: function() {
		return this.valPos;
	}
	,getNextAliasId: function() {
		return this.nextAliasId;
	}
	,getValues: function() {
		return this.values;
	}
	,translate: function(token) {
		var sqlTranslation = "";
		if(token == null) {
		} else if(js.Boot.__instanceof(token,saturn.db.query_lang.Query)) {
			var query;
			query = js.Boot.__cast(token , saturn.db.query_lang.Query);
			this.postProcess(query);
			var sqlQuery = "";
			var tokens = query.getTokens();
			var _g = 0;
			while(_g < tokens.length) {
				var token1 = tokens[_g];
				++_g;
				sqlTranslation += Std.string(this.translate(token1));
			}
		} else {
			var nestedTranslation = "";
			if(token.getTokens() != null) {
				var tokenTranslations = [];
				if(js.Boot.__instanceof(token,saturn.db.query_lang.Instr)) {
					if(this.provider.getProviderType() == "SQLITE" || this.provider.getProviderType() == "MYSQL") {
						token.tokens.pop();
						token.tokens.pop();
					}
				}
				var _g1 = 0;
				var _g11 = token.getTokens();
				while(_g1 < _g11.length) {
					var token2 = _g11[_g1];
					++_g1;
					if(js.Boot.__instanceof(token2,saturn.db.query_lang.Query)) {
						var subVisitor = new saturn.db.query_lang.SQLVisitor(this.provider,this.valPos,this.aliasToGenerated,this.nextAliasId);
						this.valPos = subVisitor.getNextValuePosition();
						this.nextAliasId = subVisitor.getNextAliasId();
						var generatedAlias = "";
						if(token2.name != null && token2.name != "") generatedAlias = this.generateId(token2.name);
						tokenTranslations.push("(" + Std.string(subVisitor.translate(token2)) + ") " + generatedAlias + " ");
						var _g2 = 0;
						var _g3 = subVisitor.getValues();
						while(_g2 < _g3.length) {
							var value = _g3[_g2];
							++_g2;
							this.values.push(value);
						}
					} else tokenTranslations.push(this.translate(token2));
				}
				var joinSep = " ";
				if(js.Boot.__instanceof(token,saturn.db.query_lang.Select) || js.Boot.__instanceof(token,saturn.db.query_lang.From) || js.Boot.__instanceof(token,saturn.db.query_lang.Function) || js.Boot.__instanceof(token,saturn.db.query_lang.Group) || js.Boot.__instanceof(token,saturn.db.query_lang.OrderBy)) joinSep = ",";
				nestedTranslation = tokenTranslations.join(joinSep);
			}
			if(js.Boot.__instanceof(token,saturn.db.query_lang.Value)) {
				var cToken;
				cToken = js.Boot.__cast(token , saturn.db.query_lang.Value);
				this.values.push(cToken.getValue());
				sqlTranslation += " " + this.getParameterNotation(this.valPos++) + " " + nestedTranslation + " ";
			} else if(js.Boot.__instanceof(token,saturn.db.query_lang.Function)) {
				if(js.Boot.__instanceof(token,saturn.db.query_lang.Trim)) {
					if(this.provider.getProviderType() == "SQLITE") sqlTranslation += "ltrim(" + nestedTranslation + ",'0'" + ")"; else sqlTranslation += "Trim( leading '0' from " + nestedTranslation + ")";
				} else {
					var funcName = "";
					if(js.Boot.__instanceof(token,saturn.db.query_lang.Max)) funcName = "MAX"; else if(js.Boot.__instanceof(token,saturn.db.query_lang.Count)) funcName = "COUNT"; else if(js.Boot.__instanceof(token,saturn.db.query_lang.Instr)) funcName = "INSTR"; else if(js.Boot.__instanceof(token,saturn.db.query_lang.Substr)) funcName = "SUBSTR"; else if(js.Boot.__instanceof(token,saturn.db.query_lang.Length)) funcName = "LENGTH"; else if(js.Boot.__instanceof(token,saturn.db.query_lang.Concat)) funcName = "CONCAT"; else if(js.Boot.__instanceof(token,saturn.db.query_lang.ToNumber)) funcName = "to_number"; else if(js.Boot.__instanceof(token,saturn.db.query_lang.CastAsInt)) funcName = "cast";
					if(!js.Boot.__instanceof(token,saturn.db.query_lang.CastAsInt)) sqlTranslation += funcName + "( " + nestedTranslation + " )"; else sqlTranslation += funcName + "( " + nestedTranslation + " as int)";
				}
			} else if(js.Boot.__instanceof(token,saturn.db.query_lang.Select)) sqlTranslation += " SELECT " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.Field)) {
				var cToken1;
				cToken1 = js.Boot.__cast(token , saturn.db.query_lang.Field);
				var clazzName = cToken1.getClass();
				var fieldPrefix = null;
				var fieldName = null;
				if(cToken1.clazzAlias != null) fieldPrefix = this.generateId(cToken1.clazzAlias);
				if(clazzName != null) {
					var model = this.provider.getModelByStringName(clazzName);
					fieldName = model.getSqlColumn(cToken1.getAttributeName());
					if(fieldPrefix == null) {
						var tableName = model.getTableName();
						var schemaName = model.getSchemaName();
						fieldPrefix = this.provider.generateQualifiedName(schemaName,tableName);
					}
				} else fieldName = this.generateId(cToken1.attributeName);
				if(cToken1.getAttributeName() == "*") sqlTranslation += fieldPrefix + ".*"; else sqlTranslation += fieldPrefix + "." + fieldName;
				sqlTranslation += " " + nestedTranslation + " ";
			} else if(js.Boot.__instanceof(token,saturn.db.query_lang.Where)) sqlTranslation += " WHERE " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.Group)) sqlTranslation += " GROUP BY " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.From)) sqlTranslation += " FROM " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.OrderBy)) sqlTranslation += " ORDER BY " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.OrderByItem)) {
				var oToken;
				oToken = js.Boot.__cast(token , saturn.db.query_lang.OrderByItem);
				var direction = "ASC";
				if(oToken.descending) direction = "DESC";
				sqlTranslation += nestedTranslation + " " + direction;
			} else if(js.Boot.__instanceof(token,saturn.db.query_lang.ClassToken)) {
				var cToken2;
				cToken2 = js.Boot.__cast(token , saturn.db.query_lang.ClassToken);
				var model1 = this.provider.getModelByStringName(cToken2.getClass());
				var tableName1 = model1.getTableName();
				var schemaName1 = model1.getSchemaName();
				var name = this.provider.generateQualifiedName(schemaName1,tableName1);
				sqlTranslation += " " + name + " ";
			} else if(js.Boot.__instanceof(token,saturn.db.query_lang.Operator)) {
				if(js.Boot.__instanceof(token,saturn.db.query_lang.And)) sqlTranslation += " AND " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.Plus)) sqlTranslation += " + " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.Minus)) sqlTranslation += " - " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.Or)) sqlTranslation += " OR " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.Equals)) sqlTranslation += " = " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.IsNull)) sqlTranslation += " IS NULL " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.IsNotNull)) sqlTranslation += " IS NOT NULL " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.GreaterThan)) sqlTranslation += " > " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.GreaterThanOrEqualTo)) sqlTranslation += " >= " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.LessThan)) sqlTranslation += " < " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.LessThanOrEqualTo)) sqlTranslation += " <= " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.In)) sqlTranslation += " IN " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.Concat)) sqlTranslation += " || " + nestedTranslation; else if(js.Boot.__instanceof(token,saturn.db.query_lang.Like)) sqlTranslation += " LIKE " + nestedTranslation;
			} else if(js.Boot.__instanceof(token,saturn.db.query_lang.ValueList)) {
				var cToken3;
				cToken3 = js.Boot.__cast(token , saturn.db.query_lang.ValueList);
				var values = cToken3.getValues();
				var itemStrings = [];
				var _g12 = 0;
				var _g4 = values.length;
				while(_g12 < _g4) {
					var i = _g12++;
					itemStrings.push(this.getParameterNotation(this.valPos++));
					values.push(values[i]);
				}
				sqlTranslation += " ( " + itemStrings.join(",") + " ) ";
			} else if(js.Boot.__instanceof(token,saturn.db.query_lang.Limit)) {
				var cToken4;
				cToken4 = js.Boot.__cast(token , saturn.db.query_lang.Limit);
				sqlTranslation += this.getLimitClause(nestedTranslation);
			} else if(js.Boot.__instanceof(token,saturn.db.query_lang.StartBlock)) sqlTranslation += " ( "; else if(js.Boot.__instanceof(token,saturn.db.query_lang.EndBlock)) sqlTranslation += " ) "; else sqlTranslation += " " + nestedTranslation + " ";
		}
		if(token != null && token.name != null && !js.Boot.__instanceof(token,saturn.db.query_lang.Query)) {
			var generatedAlias1 = this.generateId(token.name);
			sqlTranslation += "  \"" + generatedAlias1 + "\"";
		}
		return sqlTranslation;
	}
	,getProcessedResults: function(results) {
		if(results.length > 0) {
			this.generatedToAlias = new haxe.ds.StringMap();
			var $it0 = this.aliasToGenerated.keys();
			while( $it0.hasNext() ) {
				var generated = $it0.next();
				var key = this.aliasToGenerated.get(generated);
				this.generatedToAlias.set(key,generated);
			}
			var fields = Reflect.fields(results[0]);
			var toRename = [];
			var _g = 0;
			while(_g < fields.length) {
				var field = fields[_g];
				++_g;
				if(this.generatedToAlias.exists(field)) toRename.push(field);
			}
			if(toRename.length > 0) {
				var _g1 = 0;
				while(_g1 < results.length) {
					var row = results[_g1];
					++_g1;
					var _g11 = 0;
					while(_g11 < toRename.length) {
						var field1 = toRename[_g11];
						++_g11;
						var val = Reflect.field(row,field1);
						Reflect.deleteField(row,field1);
						Reflect.setField(row,this.generatedToAlias.get(field1),val);
					}
				}
			}
		}
		return results;
	}
	,getParameterNotation: function(i) {
		if(this.provider.getProviderType() == "ORACLE") return ":" + i; else if(this.provider.getProviderType() == "MYSQL") return "?"; else if(this.provider.getProviderType() == "PGSQL") return "$" + i; else return "?";
	}
	,postProcess: function(query) {
		if(this.provider.getProviderType() == "ORACLE") {
			if(query.tokens != null && query.tokens.length > 0) {
				var _g = 0;
				var _g1 = query.tokens;
				while(_g < _g1.length) {
					var token = _g1[_g];
					++_g;
					if(js.Boot.__instanceof(token,saturn.db.query_lang.Limit)) {
						if(query.whereToken == null) query.whereToken = new saturn.db.query_lang.Where();
						var where = query.getWhere();
						where.add(token);
						HxOverrides.remove(query.tokens,token);
					}
				}
			}
		}
	}
	,getLimitClause: function(txt) {
		if(this.provider.getProviderType() == "ORACLE") return " ROWNUM < " + txt; else if(this.provider.getProviderType() == "MYSQL") return " limit " + txt; else if(this.provider.getProviderType() == "PGSQL") return " LIMIT " + txt; else return " limit " + txt;
	}
	,buildSqlInClause: function(numIds,nextVal,func) {
		if(nextVal == null) nextVal = 0;
		var inClause_b = "";
		inClause_b += "IN(";
		inClause_b += ")";
		return inClause_b;
	}
	,__class__: saturn.db.query_lang.SQLVisitor
};
saturn.db.query_lang.Select = $hxClasses["saturn.db.query_lang.Select"] = function() {
	saturn.db.query_lang.Token.call(this,null);
};
saturn.db.query_lang.Select.__name__ = ["saturn","db","query_lang","Select"];
saturn.db.query_lang.Select.__super__ = saturn.db.query_lang.Token;
saturn.db.query_lang.Select.prototype = $extend(saturn.db.query_lang.Token.prototype,{
	__class__: saturn.db.query_lang.Select
});
saturn.db.query_lang.StartBlock = $hxClasses["saturn.db.query_lang.StartBlock"] = function() {
	saturn.db.query_lang.Token.call(this,null);
};
saturn.db.query_lang.StartBlock.__name__ = ["saturn","db","query_lang","StartBlock"];
saturn.db.query_lang.StartBlock.__super__ = saturn.db.query_lang.Token;
saturn.db.query_lang.StartBlock.prototype = $extend(saturn.db.query_lang.Token.prototype,{
	__class__: saturn.db.query_lang.StartBlock
});
saturn.db.query_lang.Substr = $hxClasses["saturn.db.query_lang.Substr"] = function(value,position,length) {
	saturn.db.query_lang.Function.call(this,[value,position,length]);
};
saturn.db.query_lang.Substr.__name__ = ["saturn","db","query_lang","Substr"];
saturn.db.query_lang.Substr.__super__ = saturn.db.query_lang.Function;
saturn.db.query_lang.Substr.prototype = $extend(saturn.db.query_lang.Function.prototype,{
	__class__: saturn.db.query_lang.Substr
});
saturn.db.query_lang.ToNumber = $hxClasses["saturn.db.query_lang.ToNumber"] = function(token) {
	saturn.db.query_lang.Function.call(this,[token]);
};
saturn.db.query_lang.ToNumber.__name__ = ["saturn","db","query_lang","ToNumber"];
saturn.db.query_lang.ToNumber.__super__ = saturn.db.query_lang.Function;
saturn.db.query_lang.ToNumber.prototype = $extend(saturn.db.query_lang.Function.prototype,{
	__class__: saturn.db.query_lang.ToNumber
});
saturn.db.query_lang.Trim = $hxClasses["saturn.db.query_lang.Trim"] = function(value) {
	saturn.db.query_lang.Function.call(this,[value]);
};
saturn.db.query_lang.Trim.__name__ = ["saturn","db","query_lang","Trim"];
saturn.db.query_lang.Trim.__super__ = saturn.db.query_lang.Function;
saturn.db.query_lang.Trim.prototype = $extend(saturn.db.query_lang.Function.prototype,{
	__class__: saturn.db.query_lang.Trim
});
saturn.db.query_lang.Value = $hxClasses["saturn.db.query_lang.Value"] = function(value) {
	saturn.db.query_lang.Token.call(this,null);
	this.value = value;
};
saturn.db.query_lang.Value.__name__ = ["saturn","db","query_lang","Value"];
saturn.db.query_lang.Value.__super__ = saturn.db.query_lang.Token;
saturn.db.query_lang.Value.prototype = $extend(saturn.db.query_lang.Token.prototype,{
	value: null
	,getValue: function() {
		return this.value;
	}
	,__class__: saturn.db.query_lang.Value
});
saturn.db.query_lang.ValueList = $hxClasses["saturn.db.query_lang.ValueList"] = function(values) {
	this.values = values;
	saturn.db.query_lang.Token.call(this,null);
};
saturn.db.query_lang.ValueList.__name__ = ["saturn","db","query_lang","ValueList"];
saturn.db.query_lang.ValueList.__super__ = saturn.db.query_lang.Token;
saturn.db.query_lang.ValueList.prototype = $extend(saturn.db.query_lang.Token.prototype,{
	values: null
	,getValues: function() {
		return this.values;
	}
	,__class__: saturn.db.query_lang.ValueList
});
saturn.db.query_lang.Where = $hxClasses["saturn.db.query_lang.Where"] = function() {
	saturn.db.query_lang.Token.call(this,null);
};
saturn.db.query_lang.Where.__name__ = ["saturn","db","query_lang","Where"];
saturn.db.query_lang.Where.__super__ = saturn.db.query_lang.Token;
saturn.db.query_lang.Where.prototype = $extend(saturn.db.query_lang.Token.prototype,{
	__class__: saturn.db.query_lang.Where
});
if(!saturn.server) saturn.server = {};
if(!saturn.server.plugins) saturn.server.plugins = {};
if(!saturn.server.plugins.core) saturn.server.plugins.core = {};
saturn.server.plugins.core.AuthenticationManager = $hxClasses["saturn.server.plugins.core.AuthenticationManager"] = function() { };
saturn.server.plugins.core.AuthenticationManager.__name__ = ["saturn","server","plugins","core","AuthenticationManager"];
saturn.server.plugins.core.AuthenticationManager.prototype = {
	authenticate: null
	,__class__: saturn.server.plugins.core.AuthenticationManager
};
saturn.server.plugins.core.BaseServerPlugin = $hxClasses["saturn.server.plugins.core.BaseServerPlugin"] = function(saturn1,config) {
	this.debug = (js.Node.require("debug"))("saturn:plugin");
	this.saturn = saturn1;
	this.config = config;
	this.plugins = [];
	this.processConfig();
	this.registerPlugins();
};
saturn.server.plugins.core.BaseServerPlugin.__name__ = ["saturn","server","plugins","core","BaseServerPlugin"];
saturn.server.plugins.core.BaseServerPlugin.prototype = {
	saturn: null
	,config: null
	,plugins: null
	,debug: null
	,processConfig: function() {
	}
	,registerPlugins: function() {
		var clazzName = Type.getClassName(js.Boot.getClass(this));
		if(Object.prototype.hasOwnProperty.call(this.config,"plugins")) {
			var pluginDefs = Reflect.field(this.config,"plugins");
			var _g = 0;
			while(_g < pluginDefs.length) {
				var pluginDef = pluginDefs[_g];
				++_g;
				var clazzStr = Reflect.field(pluginDef,"clazz");
				var clazz = Type.resolveClass(clazzStr);
				var plugin = Type.createInstance(clazz,[this,pluginDef]);
				this.debug("CHILD_PLUGIN" + Type.getClassName(clazz));
				this.plugins.push(plugin);
			}
		}
	}
	,getSaturnServer: function() {
		return this.saturn;
	}
	,__class__: saturn.server.plugins.core.BaseServerPlugin
};
saturn.server.plugins.core.AuthenticationPlugin = $hxClasses["saturn.server.plugins.core.AuthenticationPlugin"] = function(server,config) {
	saturn.server.plugins.core.BaseServerPlugin.call(this,server,config);
	this.configureAuthenticationManager();
	this.installAuth();
	if(config.password_in_token) this.debug("Warning passwords will be stored in JSON web tokens using AES encryption.  " + "To disable set password_in_token to false in your confirguation file");
};
saturn.server.plugins.core.AuthenticationPlugin.__name__ = ["saturn","server","plugins","core","AuthenticationPlugin"];
saturn.server.plugins.core.AuthenticationPlugin.__super__ = saturn.server.plugins.core.BaseServerPlugin;
saturn.server.plugins.core.AuthenticationPlugin.prototype = $extend(saturn.server.plugins.core.BaseServerPlugin.prototype,{
	authManager: null
	,installAuth: function() {
		var _g = this;
		var jwt = js.Node.require("jsonwebtoken");
		var uuid = js.Node.require("node-uuid");
		var crypto = js.Node.require("crypto");
		this.saturn.getServer().post("/login",function(req,res,next) {
			var username = req.params.username;
			var password = req.params.password;
			_g.authManager.authenticate(username,password,function(user) {
				var db = _g.saturn.getRedisClient();
				user.uuid = uuid.v4();
				user.username = username;
				if(_g.config.password_in_token) {
					var iv = crypto.randomBytes(_g.config.encrypt_iv_length);
					var cipher = crypto.createCipheriv(_g.config.algorithm,new Buffer(_g.config.encrypt_password),iv);
					var crypted = cipher.update(password,"utf8","hex");
					crypted += cipher["final"]("hex");
					password = crypted;
					user.password = iv.toString("hex") + ":" + password;
				}
				db.set("USER_UUID: " + user.uuid,user.username);
				var token = jwt.sign({ firstname : user.firstname, lastname : user.lastname, email : user.email, uuid : user.uuid, username : user.username, password : user.password},_g.config.jwt_secret,{ expiresIn : Std.string(_g.config.jwt_timeout) + "m"});
				res.header("Set-Cookie","saturn_token=" + token);
				res.send(200,{ token : token, full_name : user.firstname + " " + user.lastname, email : user.email, 'projects' : user.projects});
				next();
			},function(err) {
				res.send(200,{ error : "Unable to authenticate"});
				next();
			},req.connection.remoteAddress);
		});
		var socketioJwt = js.Node.require("socketio-jwt");
		this.saturn.getServerSocket().on("connection",socketioJwt.authorize({ required : false, secret : this.config.jwt_secret, timeout : 15000, additional_auth : $bind(this,this.additionalAuth)})).on("authenticated",function(socket) {
			socket.on("logout",function(data) {
				_g.saturn.getSocketUser(socket,function(authUser) {
					if(authUser != null) {
						var db1 = _g.saturn.getRedisClient();
						db1.del("USER_UUID: " + authUser.uuid);
						_g.saturn.setUser(socket,null);
					}
				});
			});
		});
		this.saturn.setAuthenticationPlugin(this);
	}
	,configureAuthenticationManager: function() {
		var clazzStr = this.config.authentication_manager.clazz;
		var clazz = Type.resolveClass(clazzStr);
		this.authManager = Type.createInstance(clazz,[this.config.authentication_manager,this]);
		if(!js.Boot.__instanceof(this.authManager,saturn.server.plugins.core.AuthenticationManager)) throw new js._Boot.HaxeError("Unable to setup authentication manager\n" + clazzStr + " should implement " + Std.string(saturn.server.plugins.core.AuthenticationManager));
	}
	,additionalAuth: function(user,onSuccess,onFailure) {
		var db = this.saturn.getRedisClient();
		this.saturn.isUserAuthenticated(user,function(authUser) {
			if(authUser != null) onSuccess(); else onFailure("On Error","invalid_token");
		});
	}
	,decryptUserPassword: function(user,cb) {
		var crypto = js.Node.require("crypto");
		var dBuffer = Buffer;
		var parts = user.password.split(":");
		var decipher = crypto.createDecipheriv(this.config.algorithm,new Buffer(this.config.encrypt_password),dBuffer.from(parts[0],"hex"));
		var dec = decipher.update(parts[1],"hex","utf8");
		dec += decipher["final"]("utf8");
		var userClone = new saturn.core.User();
		userClone.firstname = user.firstname;
		userClone.lastname = user.lastname;
		userClone.password = dec;
		userClone.username = user.username;
		cb(null,userClone);
	}
	,isUserAuthenticated: function(user,cb) {
		if(user == null) cb(null); else {
			var db = this.saturn.getRedisClient();
			db.get("USER_UUID: " + user.uuid,function(err,reply) {
				if(err || reply == null) cb(null); else cb(user);
			});
		}
	}
	,__class__: saturn.server.plugins.core.AuthenticationPlugin
});
saturn.server.plugins.core.ConfigurationPlugin = $hxClasses["saturn.server.plugins.core.ConfigurationPlugin"] = function() { };
saturn.server.plugins.core.ConfigurationPlugin.__name__ = ["saturn","server","plugins","core","ConfigurationPlugin"];
saturn.server.plugins.core.ConfigurationPlugin.getConfiguration = function(query,params,clazz,cb,hookConfig) {
	saturn.core.Util.debug("Returning configuration");
	if(hookConfig == null) cb(null,"Hook configuration is missing"); else if(Object.prototype.hasOwnProperty.call(hookConfig,"config")) cb(Reflect.field(hookConfig,"config"),null); else cb(null,"ConfigurationPlugin configuration block is missing config attribute from JSON");
};
saturn.server.plugins.core.DefaultProviderPlugin = $hxClasses["saturn.server.plugins.core.DefaultProviderPlugin"] = function(server,config) {
	saturn.server.plugins.core.BaseServerPlugin.call(this,server,config);
	this.configureProviders();
};
saturn.server.plugins.core.DefaultProviderPlugin.__name__ = ["saturn","server","plugins","core","DefaultProviderPlugin"];
saturn.server.plugins.core.DefaultProviderPlugin.__super__ = saturn.server.plugins.core.BaseServerPlugin;
saturn.server.plugins.core.DefaultProviderPlugin.prototype = $extend(saturn.server.plugins.core.BaseServerPlugin.prototype,{
	configureProviders: function() {
		var connections = this.config.connections;
		var _g = 0;
		while(_g < connections.length) {
			var connection = connections[_g];
			++_g;
			this._configureProvider(connection);
		}
	}
	,configureProviderold: function() {
		var _g = this;
		var driver = this.config.connection.driver;
		var clazz = null;
		try {
			clazz = Type.resolveClass(driver);
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			js.Node.console.log(e);
			js.Node.process.exit(-1);
		}
		var models = null;
		try {
			models = Type.createInstance(Type.resolveClass(this.config.connection.model_mapping),[]).models;
			this.debug("Hello World");
		} catch( e1 ) {
			if (e1 instanceof js._Boot.HaxeError) e1 = e1.val;
			js.Node.console.log(e1);
			js.Node.process.exit(-1);
		}
		if(this.config.connection.use_pool) {
			var pool = saturn.db.NodePool.generatePool("main_db",3,3,2000000,true,function(cb) {
				_g.debug("Configuring provider");
				var provider = Type.createInstance(clazz,[models,_g.config.connection,false]);
				provider.dataBinding(false);
				provider.readModels(function(err) {
					cb(err,provider);
					_g.debug(err);
				});
				provider.enableCache(_g.config.enable_cache);
			},function(resource) {
			});
			saturn.client.core.CommonCore.setPool(this.config.name,pool,this.config.default_provider);
		} else {
			this.debug("Configuring provider");
			var provider1 = Type.createInstance(clazz,[models,this.config.connection,false]);
			provider1.enableCache(this.config.enable_cache);
			provider1.dataBinding(false);
			provider1.readModels(function(err1) {
				if(err1 != null) {
					_g.debug(err1);
					js.Node.process.exit(-1);
				}
			});
			saturn.client.core.CommonCore.setDefaultProvider(provider1,this.config.name,this.config.default_provider);
		}
	}
	,_configureProvider: function(config) {
		var _g = this;
		var driver = config.driver;
		var clazz = null;
		try {
			clazz = Type.resolveClass(driver);
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			js.Node.console.log(e);
			js.Node.process.exit(-1);
		}
		var models = null;
		try {
			models = Type.createInstance(Type.resolveClass(config.model_mapping),[]).models;
			this.debug("Hello World " + config.model_mapping);
		} catch( e1 ) {
			if (e1 instanceof js._Boot.HaxeError) e1 = e1.val;
			js.Node.console.log(e1);
			js.Node.process.exit(-1);
		}
		if(config.use_pool) {
			var pool = saturn.db.NodePool.generatePool("main_db",3,3,2000000,true,function(cb) {
				_g.debug("Configuring provider");
				var provider = Type.createInstance(clazz,[models,config,false]);
				provider.dataBinding(false);
				provider.setName(config.name);
				provider.readModels(function(err) {
					cb(err,provider);
					_g.debug(err);
				});
				provider.enableCache(config.enable_cache);
			},function(resource) {
			});
			saturn.client.core.CommonCore.setPool(config.name,pool,config.default_provider);
		} else {
			this.debug("Configuring provider");
			var provider1 = Type.createInstance(clazz,[models,config,false]);
			provider1.enableCache(config.enable_cache);
			provider1.dataBinding(false);
			provider1.setName(config.name);
			provider1.readModels(function(err1) {
				if(err1 != null) {
					_g.debug(err1);
					js.Node.process.exit(-1);
				}
			});
			saturn.client.core.CommonCore.setDefaultProvider(provider1,config.name,config.default_provider);
		}
	}
	,__class__: saturn.server.plugins.core.DefaultProviderPlugin
});
saturn.server.plugins.core.ExternalAuthenticationPlugin = $hxClasses["saturn.server.plugins.core.ExternalAuthenticationPlugin"] = function(config) {
	this.config = config;
};
saturn.server.plugins.core.ExternalAuthenticationPlugin.__name__ = ["saturn","server","plugins","core","ExternalAuthenticationPlugin"];
saturn.server.plugins.core.ExternalAuthenticationPlugin.__interfaces__ = [saturn.server.plugins.core.AuthenticationManager];
saturn.server.plugins.core.ExternalAuthenticationPlugin.prototype = {
	config: null
	,authenticate: function(username,password,onSuccess,onFailure,src) {
		var hookConfig = this.config.external_hook;
		var authObj = [{ 'username' : username, 'password' : password, 'mode' : "authenticate", 'src' : src}];
		saturn.db.provider.hooks.ExternalJsonHook.run("Authenticate",authObj,null,function(objs,error) {
			if(error != null) {
				saturn.core.Util.debug(error);
				onFailure("Internal server error");
			} else {
				saturn.core.Util.debug("Authentication manager returned");
				var authResponse = objs[0];
				if(authResponse.outcome == "success") {
					var user = new saturn.core.User();
					user.firstname = authResponse.firstName;
					user.lastname = authResponse.lastName;
					user.email = authResponse.email;
					user.projects = authResponse.projects;
					saturn.core.Util.debug("Returning success");
					onSuccess(user);
				} else {
					saturn.core.Util.debug("Returning error");
					onFailure("Unable to authenticate");
				}
			}
		},hookConfig);
	}
	,__class__: saturn.server.plugins.core.ExternalAuthenticationPlugin
};
saturn.server.plugins.core.MySQLAuthPlugin = $hxClasses["saturn.server.plugins.core.MySQLAuthPlugin"] = function(config) {
	this.config = config;
};
saturn.server.plugins.core.MySQLAuthPlugin.__name__ = ["saturn","server","plugins","core","MySQLAuthPlugin"];
saturn.server.plugins.core.MySQLAuthPlugin.__interfaces__ = [saturn.server.plugins.core.AuthenticationManager];
saturn.server.plugins.core.MySQLAuthPlugin.prototype = {
	config: null
	,authenticate: function(username,password,onSuccess,onFailure,src) {
		var mysql = js.Node.require("mysql2");
		saturn.core.Util.debug("Connecting as " + username + " to " + username + " with password " + password + " on " + Std.string(this.config.hostname));
		var connection = mysql.createConnection({ host : this.config.hostname, user : username, password : password, database : username});
		connection.on("connect",function(connect) {
			if(connect) connection.query("\r\n                    SELECT\r\n                     *\r\n                    FROM\r\n                        icmdb_page_secure.V_USERS\r\n                    WHERE\r\n                        Name=?\r\n                ",[username],function(err,res) {
				if(err) {
					js.Node.console.log("Error connecting");
					onFailure("Unable to connect");
				} else {
					js.Node.console.log("Success");
					if(res.length == 0) {
						js.Node.console.log("Unable to connect");
						onFailure("Unable to connect");
					} else {
						var userRow = res[0];
						var user = new saturn.core.User();
						user.firstname = userRow.First_Name;
						user.lastname = userRow.Last_Name;
						user.email = userRow.EMail;
						js.Node.console.log("Login succeded!");
						onSuccess(user);
					}
				}
				connection.end();
			}); else {
				js.Node.console.log("Unable to connect");
				onFailure("Unable to connect");
			}
		});
		connection.on("error",function(err1) {
			js.Node.console.log("Error: " + (err1 == null?"null":"" + err1));
			onFailure("Unable to connect");
		});
	}
	,__class__: saturn.server.plugins.core.MySQLAuthPlugin
};
saturn.server.plugins.core.ProxyPlugin = $hxClasses["saturn.server.plugins.core.ProxyPlugin"] = function(server,config) {
	saturn.server.plugins.core.BaseServerPlugin.call(this,server,config);
	this.configure();
};
saturn.server.plugins.core.ProxyPlugin.__name__ = ["saturn","server","plugins","core","ProxyPlugin"];
saturn.server.plugins.core.ProxyPlugin.__super__ = saturn.server.plugins.core.BaseServerPlugin;
saturn.server.plugins.core.ProxyPlugin.prototype = $extend(saturn.server.plugins.core.BaseServerPlugin.prototype,{
	proxy: null
	,configure: function() {
		var _g2 = this;
		var httpProxy = js.Node.require("http-proxy");
		var Agent = js.Node.require("agentkeepalive");
		var agent = new Agent({
            maxSockets: 100,
            keepAlive: true,
            maxFreeSockets: 20,
            keepAliveMsecs:100000,
            timeout: 600000,
            keepAliveTimeout: 300000 // free socket keepalive for 30 seconds
        });
		this.proxy = httpProxy.createProxyServer({ agent : agent, changeOrigin : true});
		var server = this.getSaturnServer().getServer();
		var restify = js.Node.require("restify");
		var _g = 0;
		var _g1 = Reflect.fields(this.config.routes);
		while(_g < _g1.length) {
			var route = _g1[_g];
			++_g;
			var routeConfig = [Reflect.field(this.config.routes,route)];
			this.debug("Routing " + route + " to " + routeConfig[0].target);
			if(routeConfig[0].prestart != null) {
				var proc = js.Node.require("child_process").spawn(routeConfig[0].prestart,routeConfig[0].args,{ env : js.Node.process.env, cwd : routeConfig[0].cwd});
				proc.stderr.on("data",(function() {
					return function(error) {
						_g2.debug(error);
					};
				})());
				proc.stdout.on("data",(function() {
					return function(error1) {
						_g2.debug(error1);
					};
				})());
				proc.on("exit",(function() {
					return function() {
						_g2.debug("Exited");
					};
				})());
			}
			if(routeConfig[0].GET) {
				this.debug("Adding GET proxy");
				server.get(route,(function(routeConfig) {
					return function(req,res) {
						_g2.debug("Request: " + req.getPath());
						_g2.proxyRequest(req,res,routeConfig[0].target);
					};
				})(routeConfig));
			}
			if(routeConfig[0].POST) {
				this.debug("Adding POST proxy");
				server.post(route,(function(routeConfig) {
					return function(req1,res1) {
						_g2.proxyRequest(req1,res1,routeConfig[0].target);
					};
				})(routeConfig));
			}
		}
		this.proxy.on("error",function(error2,req2,res2) {
			var json;
			_g2.debug("proxy error",error2);
			if(!res2.headersSent) res2.writeHead(500,{ 'content-type' : "application/json"});
			json = { error : "proxy_error", reason : error2.message};
			res2.end(haxe.Json.stringify(json,null,null));
		});
	}
	,proxyRequest: function(req,res,target) {
		this.proxy.web(req,res,{ target : target});
	}
	,wrapMiddleware: function(middleware) {
		var _g = this;
		return function(req,res,next) {
			if(StringTools.startsWith(req.path(),"/GlycanBuilder")) {
				_g.debug("Skipping " + req.getPath());
				next();
			} else {
				_g.debug("Playing " + req.getPath());
				if((middleware instanceof Array) && middleware.__enum__ == null) middleware[0](req,res,function() {
					middleware[1](req,res,next);
				}); else middleware(req,res,next);
			}
		};
	}
	,__class__: saturn.server.plugins.core.ProxyPlugin
});
saturn.server.plugins.core.RESTSocketWrapperPlugin = $hxClasses["saturn.server.plugins.core.RESTSocketWrapperPlugin"] = function(server,config) {
	this.uuidToJobInfo = new haxe.ds.StringMap();
	this.uuidToResponse = new haxe.ds.StringMap();
	this.uuidToToken = new haxe.ds.StringMap();
	this.uuidModule = js.Node.require("node-uuid");
	saturn.server.plugins.core.BaseServerPlugin.call(this,server,config);
	this.registerListeners();
};
saturn.server.plugins.core.RESTSocketWrapperPlugin.__name__ = ["saturn","server","plugins","core","RESTSocketWrapperPlugin"];
saturn.server.plugins.core.RESTSocketWrapperPlugin.fetch_compound = function(path,req,res,next,handle_function) {
	var command = "_remote_provider_._data_request_objects_namedquery";
	var d = { };
	var json = { };
	if(Object.prototype.hasOwnProperty.call(req.params,"format") && req.params.format == "svg") {
		json.action = "as_svg";
		json.ctab_content = req.params.molblock;
	}
	d.queryId = "saturn.db.provider.hooks.ExternalJsonHook:Fetch";
	d.parameters = haxe.Serializer.run([json]);
	handle_function(path,req,res,next,command,d);
};
saturn.server.plugins.core.RESTSocketWrapperPlugin.__super__ = saturn.server.plugins.core.BaseServerPlugin;
saturn.server.plugins.core.RESTSocketWrapperPlugin.prototype = $extend(saturn.server.plugins.core.BaseServerPlugin.prototype,{
	uuidModule: null
	,uuidToToken: null
	,uuidToResponse: null
	,uuidToJobInfo: null
	,extractAuthenticationToken: function(req) {
		var cookies = req.cookies;
		if(cookies != null && cookies.saturn_token != null) return cookies.saturn_token; else return req.params.token;
	}
	,invalidAuthentication: function(req,res,next) {
		res.status(403);
		res.send("Bad token");
		next();
	}
	,registerListeners: function() {
		var _g = this;
		this.saturn.getServer().post("/api/queue/:uuid",function(req1,res1,next1) {
			var token1 = _g.extractAuthenticationToken(req1);
			if(token1 == null) {
				_g.invalidAuthentication(req1,res1,next1);
				return;
			}
			var uuid1 = req1.params.uuid;
			if(_g.uuidToToken.exists(uuid1)) {
				if(_g.uuidToToken.get(uuid1) == token1) {
					if(_g.uuidToResponse.exists(uuid1)) {
						var response = _g.uuidToResponse.get(uuid1);
						res1.status(200);
						res1.send(response);
						next1();
					} else {
						res1.status(102);
						next1();
					}
				} else {
					res1.status(403);
					res1.send("Token/uuid missmatch expected " + _g.uuidToToken.get(uuid1) + " and you passed " + token1);
					next1();
				}
			} else {
				res1.status(403);
				res1.send("Bad uuid");
				next1();
			}
		});
		var handle_function = function(path,req,res,next,command,json) {
			_g.debug("In Function");
			var token = _g.extractAuthenticationToken(req);
			if(token == null) {
				_g.invalidAuthentication(req,res,next);
				return;
			}
			if(command == null && json == null) {
				command = req.params.command;
				json = js.Node.parse(req.params.json);
				if(path == "/api/command/") {
					if(command == "_remote_provider_._data_request_objects_namedquery") {
						var d = { };
						d.queryId = json.queryId;
						d.parameters = haxe.Serializer.run(json.parameters);
						json = d;
					}
				} else if(path == "/api/provider/command/") {
					var d1 = { };
					d1.queryId = command;
					command = "_remote_provider_._data_request_objects_namedquery";
					d1.parameters = haxe.Serializer.run(json.parameters);
					json = d1;
				}
			}
			var wait = "no";
			if(Object.prototype.hasOwnProperty.call(req.params,"wait")) {
				wait = req.params.wait;
				_g.debug("Going to wait");
				if(wait != "no" && wait != "yes") {
					res.status(403);
					res.send("Wait setting must be yes or no");
					next();
					return;
				}
			}
			var uuid = _g.uuidModule.v4();
			_g.uuidToToken.set(uuid,token);
			res.header("Location","/api/queue/" + uuid);
			if(wait == "no") {
				res.status(202);
				res.send();
				next();
			} else next();
			var io = js.Node.require("socket.io-client");
			var protocol = "ws";
			if(_g.saturn.isEncrypted()) protocol = "wss";
			var conStr = protocol + "://" + _g.saturn.getInternalConnectionHostName() + ":" + Std.string(_g.saturn.getServerConfig().port);
			_g.debug("Connecting to " + conStr);
			var socket = io.connect(conStr,{ port : 8091});
			var openTime = new Date().getTime();
			var status = new haxe.ds.StringMap();
			if(__map_reserved.connected != null) status.setReserved("connected",false); else status.h["connected"] = false;
			if(__map_reserved.disconnected != null) status.setReserved("disconnected",false); else status.h["disconnected"] = false;
			socket.on("error",function(data) {
				_g.respond(uuid,500,socket,wait,"Unknown error",status,res);
			});
			socket.on("authenticated",function(data1) {
				_g.runCommand(socket,command,json,uuid);
			});
			socket.on("unauthorized",function(data2) {
				_g.respond(uuid,403,socket,wait,"Unauthorised",status,res);
			});
			socket.on("receiveError",function(data3) {
				_g.respond(uuid,200,socket,wait,data3,status,res);
			});
			socket.on("__response__",function(data4) {
				_g.respond(uuid,200,socket,wait,data4,status,res);
			});
			socket.on("connect",function(data5) {
				if(__map_reserved.connected != null) status.setReserved("connected",true); else status.h["connected"] = true;
				socket.emit("authenticate",{ token : token});
			});
			var cleanUp = null;
			cleanUp = function() {
				var currentTime = new Date().getTime();
				if(__map_reserved.disconnected != null?status.getReserved("disconnected"):status.h["disconnected"]) {
				} else if((currentTime - openTime) / 1000 > 300) {
					socket.disconnect();
					if(__map_reserved.disconnected != null) status.setReserved("disconnected",true); else status.h["disconnected"] = true;
					if(wait == "yes") {
						_g.debug("Sending response");
						res.status(200);
						res.send("Connection time-out");
					}
				} else haxe.Timer.delay(cleanUp,10000);
			};
			cleanUp();
		};
		this.saturn.getServer().post("/api",function(req2,res2,next2) {
			handle_function("/api/",req2,res2,next2);
		});
		this.saturn.getServer().post("/api/command/:command",function(req3,res3,next3) {
			handle_function("/api/command/",req3,res3,next3);
		});
		this.saturn.getServer().post("/api/provider/command/:command",function(req4,res4,next4) {
			handle_function("/api/provider/command/",req4,res4,next4);
		});
		if(Object.prototype.hasOwnProperty.call(this.config,"commands")) {
			var commands = Reflect.field(this.config,"commands");
			var _g1 = 0;
			while(_g1 < commands.length) {
				var command1 = commands[_g1];
				++_g1;
				var route = [command1.route];
				var format_method_clazz = [command1.format_request_clazz];
				var format_method_method = [command1.format_request_method];
				var http_method = command1.http_method;
				if(http_method == "POST") this.saturn.getServer().post(route[0],(function(format_method_method,format_method_clazz,route) {
					return function(req5,res5,next5) {
						var clazz = Type.resolveClass(format_method_clazz[0]);
						(Reflect.field(clazz,format_method_method[0]))(route[0],req5,res5,next5,handle_function);
					};
				})(format_method_method,format_method_clazz,route)); else if(http_method == "PUT") this.saturn.getServer().put(route[0],(function(format_method_method,format_method_clazz,route) {
					return function(req6,res6,next6) {
						var clazz1 = Type.resolveClass(format_method_clazz[0]);
						(Reflect.field(clazz1,format_method_method[0]))(route[0],req6,res6,next6,handle_function);
					};
				})(format_method_method,format_method_clazz,route)); else if(http_method == "DELETE") this.saturn.getServer().del(route[0],(function(format_method_method,format_method_clazz,route) {
					return function(req7,res7,next7) {
						var clazz2 = Type.resolveClass(format_method_clazz[0]);
						(Reflect.field(clazz2,format_method_method[0]))(route[0],req7,res7,next7,handle_function);
					};
				})(format_method_method,format_method_clazz,route)); else if(http_method == "GET") this.saturn.getServer().get(route[0],(function(format_method_method,format_method_clazz,route) {
					return function(req8,res8,next8) {
						var clazz3 = Type.resolveClass(format_method_clazz[0]);
						(Reflect.field(clazz3,format_method_method[0]))(route[0],req8,res8,next8,handle_function);
					};
				})(format_method_method,format_method_clazz,route));
			}
		}
	}
	,respond: function(uuid,statusCode,socket,wait,data,status,res) {
		var remappedData = data;
		if(Object.prototype.hasOwnProperty.call(data,"json")) {
			if(Object.prototype.hasOwnProperty.call(data,"bioinfJobId")) remappedData = { 'uuid' : data.bioinfJobId};
			if(Object.prototype.hasOwnProperty.call(data.json,"error")) remappedData.error = data.json.error;
			if(Object.prototype.hasOwnProperty.call(data.json,"objects")) {
				var objects = data.json.objects;
				var returnKey = "result-set";
				if(objects != null && objects.length > 0 && Object.prototype.hasOwnProperty.call(objects[0],"result-set")) objects = Reflect.field(objects[0],"result-set"); else if(objects != null && objects.length > 0 && Object.prototype.hasOwnProperty.call(objects[0],"refreshed_objects")) {
					objects = Reflect.field(objects[0],"refreshed_objects");
					returnKey = "refreshed-objects";
				} else if(objects != null && objects.length > 0 && Object.prototype.hasOwnProperty.call(objects[0],"upload_set")) objects = Reflect.field(objects[0],"upload_set");
				remappedData[returnKey] = objects;
			} else {
				var _g = 0;
				var _g1 = Reflect.fields(data.json);
				while(_g < _g1.length) {
					var field = _g1[_g];
					++_g;
					Reflect.setField(remappedData,field,Reflect.field(data.json,field));
				}
			}
		}
		if(wait == "yes") {
			this.debug("Sending response");
			res.status(statusCode);
			res.send(remappedData);
		} else this.debug("Not sending response");
		var value = remappedData;
		this.uuidToResponse.set(uuid,value);
		socket.disconnect();
		status.set("disconnected",true);
	}
	,runCommand: function(socket,command,json,uuid) {
		json.msgId = uuid;
		json.bioinfJobId = uuid;
		this.uuidToJobInfo.set(uuid,{ 'MSG' : command, 'JSON' : json});
		this.debug("Sending command " + command);
		socket.emit(command,json);
	}
	,__class__: saturn.server.plugins.core.RESTSocketWrapperPlugin
});
saturn.server.plugins.core.SATurnDefaultRESTRouter = $hxClasses["saturn.server.plugins.core.SATurnDefaultRESTRouter"] = function() {
};
saturn.server.plugins.core.SATurnDefaultRESTRouter.__name__ = ["saturn","server","plugins","core","SATurnDefaultRESTRouter"];
saturn.server.plugins.core.SATurnDefaultRESTRouter.update_blastdb = function(path,req,res,next,handle_function) {
	var command = "_blast_updater_";
	if(!Object.prototype.hasOwnProperty.call(req.params,"database") || req.params.database == null) {
		res.status(400);
		res.send("Bad Request - database parameter missing");
		next();
	} else {
		var jsonObj = { 'database' : req.params.database};
		handle_function(path,req,res,next,command,jsonObj);
	}
};
saturn.server.plugins.core.SATurnDefaultRESTRouter.prototype = {
	__class__: saturn.server.plugins.core.SATurnDefaultRESTRouter
};
saturn.server.plugins.core.SocketPlugin = $hxClasses["saturn.server.plugins.core.SocketPlugin"] = function(server,config) {
	saturn.server.plugins.core.BaseServerPlugin.call(this,server,config);
	this.startSocketServer();
};
saturn.server.plugins.core.SocketPlugin.__name__ = ["saturn","server","plugins","core","SocketPlugin"];
saturn.server.plugins.core.SocketPlugin.__super__ = saturn.server.plugins.core.BaseServerPlugin;
saturn.server.plugins.core.SocketPlugin.prototype = $extend(saturn.server.plugins.core.BaseServerPlugin.prototype,{
	startSocketServer: function() {
		var socket = js.Node.require("socket.io").listen(this.saturn.getServer().server,{ log : true});
		socket.set("origins",this.saturn.getServerConfig().origins);
		socket.set("transports",["websocket","polling"]);
		this.saturn.setServerSocket(socket);
	}
	,__class__: saturn.server.plugins.core.SocketPlugin
});
if(!saturn.server.plugins.socket) saturn.server.plugins.socket = {};
if(!saturn.server.plugins.socket.core) saturn.server.plugins.socket.core = {};
saturn.server.plugins.socket.core.BaseServerSocketPlugin = $hxClasses["saturn.server.plugins.socket.core.BaseServerSocketPlugin"] = function(server,config) {
	this.authenticateAll = false;
	this.pluginName = Type.getClassName(js.Boot.getClass(this));
	this.messageToCB = new haxe.ds.StringMap();
	this.debug = (js.Node.require("debug"))("saturn:socket-plugin");
	saturn.server.plugins.core.BaseServerPlugin.call(this,server,config);
};
saturn.server.plugins.socket.core.BaseServerSocketPlugin.__name__ = ["saturn","server","plugins","socket","core","BaseServerSocketPlugin"];
saturn.server.plugins.socket.core.BaseServerSocketPlugin.__super__ = saturn.server.plugins.core.BaseServerPlugin;
saturn.server.plugins.socket.core.BaseServerSocketPlugin.prototype = $extend(saturn.server.plugins.core.BaseServerPlugin.prototype,{
	queueName: null
	,queue: null
	,messageToCB: null
	,pluginName: null
	,authenticateAll: null
	,processConfig: function() {
		saturn.server.plugins.core.BaseServerPlugin.prototype.processConfig.call(this);
		if(Object.prototype.hasOwnProperty.call(this.config,"authentication")) {
			if(Object.prototype.hasOwnProperty.call(this.config.authentication,"*")) {
				this.debug("(AUTH_ALL)");
				this.authenticateAll = true;
			}
		}
	}
	,registerPlugins: function() {
		if(!Object.prototype.hasOwnProperty.call(this.config,"authentication")) this.config.authentication = [];
		if(Object.prototype.hasOwnProperty.call(this.config,"plugins")) {
			var pluginDefs = Reflect.field(this.config,"plugins");
			var _g = 0;
			while(_g < pluginDefs.length) {
				var pluginDef = pluginDefs[_g];
				++_g;
				if(Object.prototype.hasOwnProperty.call(pluginDef,"authentication")) {
					var fields = Reflect.fields(pluginDef.authentication);
					var _g1 = 0;
					while(_g1 < fields.length) {
						var field = fields[_g1];
						++_g1;
						this.debug("CHILD_PLUGIN_AUTH:" + field);
						Reflect.setField(this.config.authentication,field,Reflect.field(pluginDef.authentication,field));
					}
				}
			}
		}
		saturn.server.plugins.core.BaseServerPlugin.prototype.registerPlugins.call(this);
	}
	,addListeners: function(socket) {
		var _g = this;
		var $it0 = this.messageToCB.keys();
		while( $it0.hasNext() ) {
			var message = $it0.next();
			var message1 = [message];
			socket.on(message1[0],(function(message1) {
				return function(data) {
					var handler = _g.messageToCB.get(message1[0]);
					data.socketId = socket.id;
					handler(data,socket);
				};
			})(message1));
		}
	}
	,cleanup: function(data) {
	}
	,registerListener: function(message,cb) {
		var _g = this;
		var paths = [Type.getClassName(js.Boot.getClass(this))];
		if(Object.prototype.hasOwnProperty.call(this.config,"namespaces")) {
			var namespace_defs = this.config.namespaces;
			var _g1 = 0;
			while(_g1 < namespace_defs.length) {
				var namespace_def = namespace_defs[_g1];
				++_g1;
				paths.push(namespace_def.name);
			}
		}
		var wrapperCb = cb;
		var auth = this.authenticateAll;
		if(!auth) {
			if(Object.prototype.hasOwnProperty.call(this.config,"authentication")) {
				if(Object.prototype.hasOwnProperty.call(this.config.authentication,message)) auth = true;
			}
		}
		if(auth) {
			this.debug("AUTH_REQUIRED: " + message);
			wrapperCb = function(obj,socket) {
				if(message == "_data_request_objects_namedquery") {
					_g.debug("Checking named query");
					if(Object.prototype.hasOwnProperty.call(_g.config.authentication,message)) {
						var messageConfig = Reflect.field(_g.config.authentication,message);
						var namedQueryConfigs = Reflect.field(messageConfig,"queries");
						var namedQuery = Reflect.field(obj,"queryId");
						_g.debug("Checking configuration for " + namedQuery);
						if(Object.prototype.hasOwnProperty.call(namedQueryConfigs,namedQuery)) {
							var namedQueryConfig = Reflect.field(namedQueryConfigs,namedQuery);
							if(Reflect.field(namedQueryConfig,"role") == "PUBLIC") {
								_g.debug("Named query is publically accessible!");
								cb(obj,socket);
								return;
							} else _g.debug("Role is not public");
						} else _g.debug("Missing query configuration");
					} else {
						cb(obj,socket);
						return;
					}
				}
				_g.saturn.isSocketAuthenticated(socket,function(user) {
					if(user != null) {
						_g.debug("User: " + user.username);
						cb(obj,socket);
					} else _g.handleError(obj,"Access denied<br/>Login or acquire additional permissions",null);
				});
			};
		}
		var _g2 = 0;
		while(_g2 < paths.length) {
			var path = paths[_g2];
			++_g2;
			var fqm = path;
			if(message.length > 0) fqm = path + "." + message;
			this.debug("URL: " + fqm);
			this.messageToCB.set(fqm,wrapperCb);
		}
	}
	,sendJson: function(job,json,done) {
		try {
			var jobId = this.getJobId(job);
			var response = { };
			this.debug("JSON Error: " + Std.string(json.error));
			if(json.error != null) {
				json.error = StringTools.replace(Std.string(json.error),"\n","");
				response.error = json.error;
			}
			response.bioinfJobId = jobId;
			response.json = json;
			response.msgId = jobId;
			var socket = this.getSocket(job);
			if(socket != null) {
				socket.emit("__response__",response);
				this.cleanup(job);
			} else this.debug("Unknown destination for " + jobId);
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			if( js.Boot.__instanceof(e,saturn.server.plugins.socket.core.SocketIOException) ) {
				console.log(e.toString());
			} else throw(e);
		}
		if(done != null) done();
	}
	,sendError: function(job,error,done) {
		try {
			var jobId = this.getJobId(job);
			this.debug("Error: " + error);
			var socket = this.getSocket(job);
			if(socket != null) {
				socket.emit(this.pluginName + ":response",{ bioinfJobId : jobId, error : error, msgId : jobId});
				socket.emit("__response__",{ bioinfJobId : jobId, error : error, msgId : jobId});
			} else this.debug("Unknown destination for " + jobId);
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			if( js.Boot.__instanceof(e,saturn.server.plugins.socket.core.SocketIOException) ) {
				console.log(e.toString());
			} else throw(e);
		}
		if(done != null) done();
		this.cleanup(job);
	}
	,broadcast: function(msg,json) {
		this.debug("Broadcasting message:" + msg);
		this.saturn.getServerSocket().sockets.emit(msg,json);
	}
	,registerCommand: function(command,handler) {
		this.registerListener(command,handler);
	}
	,handleError: function(job,error,cb) {
		this.debug(error);
		if(cb != null) cb();
		try {
			var socket = this.getSocket(job);
			var jobId = this.getJobId(job);
			if(socket != null) {
				var errorObj = error;
				if(Object.prototype.hasOwnProperty.call(error,"message")) socket.emit("receiveError",{ msgId : jobId, bioinfJobId : jobId, error : error, JOB_DONE : 1}); else socket.emit("receiveError",{ msgId : jobId, bioinfJobId : jobId, error : haxe.Json.stringify(error,null,null), JOB_DONE : 1});
			} else this.debug("Unable to identify socket associated with job " + jobId + "\nError: " + Std.string(error));
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			if( js.Boot.__instanceof(e,saturn.server.plugins.socket.core.SocketIOException) ) {
				console.log(e.toString());
			} else throw(e);
		}
	}
	,getJobId: function(data) {
		var jobId;
		if(Object.prototype.hasOwnProperty.call(data,"data")) {
			if(Object.prototype.hasOwnProperty.call(data.data,"bioinfJobId")) jobId = data.data.bioinfJobId; else if(Object.prototype.hasOwnProperty.call(data.data,"msgId")) jobId = data.data.msgId; else return "-1";
		} else if(Object.prototype.hasOwnProperty.call(data,"bioinfJobId")) jobId = data.bioinfJobId; else if(Object.prototype.hasOwnProperty.call(data,"msgId")) jobId = data.msgId; else return "-1";
		return jobId;
	}
	,getSocket: function(data) {
		if(Object.prototype.hasOwnProperty.call(data,"data")) {
			if(Object.prototype.hasOwnProperty.call(data.data,"socketId")) return this.saturn.getServerSocket().sockets.connected[data.data.socketId]; else throw new js._Boot.HaxeError(new saturn.server.plugins.socket.core.SocketIOException("Socket ID field missing from job"));
		} else if(Object.prototype.hasOwnProperty.call(data,"socketId")) return this.saturn.getServerSocket().sockets.connected[data.socketId]; else throw new js._Boot.HaxeError(new saturn.server.plugins.socket.core.SocketIOException("Socket ID field missing from job"));
	}
	,getSocketUserNoAuthCheck: function(socket) {
		return this.saturn.getSocketUserNoAuthCheck(socket);
	}
	,__class__: saturn.server.plugins.socket.core.BaseServerSocketPlugin
});
saturn.server.plugins.socket.core.RemoteProviderPlugin = $hxClasses["saturn.server.plugins.socket.core.RemoteProviderPlugin"] = function(server,config) {
	saturn.server.plugins.socket.core.BaseServerSocketPlugin.call(this,server,config);
	this.registerProviderCommand("_request_models",$bind(this,this.getModels));
	this.registerProviderCommand("_data_request_objects_idstartswith",$bind(this,this.getByIdStartsWith));
	this.registerProviderCommand("_data_request_objects_ids",$bind(this,this.getObjectIds));
	this.registerProviderCommand("_data_request_objects_values",$bind(this,this.getByValues));
	this.registerProviderCommand("_data_request_objects_pkeys",$bind(this,this.getByPkeys));
	this.registerProviderCommand("_data_request_objects_by_class",$bind(this,this.getByClass));
	this.registerProviderCommand("_data_request_objects_namedquery",$bind(this,this.getByNamedQuery));
	this.registerProviderCommand("_data_delete_request",$bind(this,this["delete"]));
	this.registerProviderCommand("_data_insert_request",$bind(this,this.insert));
	this.registerProviderCommand("_data_update_request",$bind(this,this.update));
	this.registerProviderCommand("_data_commit_request",$bind(this,this.commit));
	this.registerProviderCommand("_data_request_query",$bind(this,this.query));
	this.registerProviderCommand("_data_request_upload_file",$bind(this,this.uploadFile));
};
saturn.server.plugins.socket.core.RemoteProviderPlugin.__name__ = ["saturn","server","plugins","socket","core","RemoteProviderPlugin"];
saturn.server.plugins.socket.core.RemoteProviderPlugin.__super__ = saturn.server.plugins.socket.core.BaseServerSocketPlugin;
saturn.server.plugins.socket.core.RemoteProviderPlugin.prototype = $extend(saturn.server.plugins.socket.core.BaseServerSocketPlugin.prototype,{
	registerProviderCommand: function(command,cb) {
		var _g = this;
		this.registerListener(command,function(data,socket) {
			var user = _g.getSocketUserNoAuthCheck(socket);
			var providerName = saturn.client.core.CommonCore.getDefaultProviderName();
			if(Object.prototype.hasOwnProperty.call(data,"queryId")) {
				var namedQuery = Reflect.field(data,"queryId");
				_g.debug("Looking " + namedQuery);
				providerName = saturn.client.core.CommonCore.getProviderForNamedQuery(namedQuery);
				_g.debug("Got for named query: " + providerName);
			} else if(Object.prototype.hasOwnProperty.call(data,"class_name")) {
				_g.debug("Looking for provider");
				providerName = saturn.client.core.CommonCore.getProviderNameForModel(data.class_name);
				if(providerName == null) {
					_g.debug("Error finding provider for " + Std.string(data.class_name));
					_g.handleError(data,"Unable to find source for entity");
					return;
				}
			} else if(Object.prototype.hasOwnProperty.call(data,"queryStr")) {
				var query = saturn.db.query_lang.Query.deserialise(Reflect.field(data,"queryStr"));
				data.queryObj = query;
				var clazzList = query.getClassList();
				var clazz_name = clazzList[0];
				_g.debug(clazz_name);
				providerName = saturn.client.core.CommonCore.getProviderNameForModel(clazz_name);
				_g.debug(providerName);
				if(providerName == null) {
					_g.debug("Error finding provider for " + clazz_name);
					_g.handleError(data,"Unable to find source for entity");
					return;
				}
			}
			saturn.client.core.CommonCore.getDefaultProvider(function(err,provider) {
				if(err != null) _g.handleError(data,err); else {
					var disconnectOnEnd = false;
					var connectAsUser = "";
					var config = provider.getConfig();
					if(config != null) connectAsUser = config.connect_as_user;
					_g.debug("Connect as user is: " + connectAsUser);
					if(command != "_request_models" && (connectAsUser == "preferred" || connectAsUser == "force")) {
						if(user == null) {
							if(connectAsUser == "force") {
								_g.debug("Connect as user is forced but user is not logged in to " + providerName + " " + command);
								_g.handleError(data,"You must be logged in to use this provider");
								return;
							} else {
								_g.debug("Calling method on Provider");
								cb(data,provider,user,function() {
									if(disconnectOnEnd) provider._closeConnection();
								});
							}
						} else {
							_g.debug("Connecting as user");
							var original_provider = provider;
							var userProvider = provider.generatedLinkedClone();
							userProvider.setConnectAsUser(true);
							disconnectOnEnd = true;
							_g.getSaturnServer().getAuthenticationPlugin().decryptUserPassword(user,function(err1,user1) {
								userProvider.setUser(user1);
								if(err1 != null) _g.handleError(data,err1); else {
									_g.debug("Calling method on Provider");
									cb(data,userProvider,user1,function() {
										if(disconnectOnEnd) userProvider._closeConnection();
									});
								}
							});
						}
					} else {
						_g.debug("Calling method on Provider");
						cb(data,provider,user,function() {
							if(disconnectOnEnd) provider._closeConnection();
						});
					}
				}
			},providerName);
		});
	}
	,getModels: function(data,provider,user,cb) {
		var json = { };
		var combined_models = saturn.client.core.CommonCore.getCombinedModels();
		json.models = haxe.Serializer.run(combined_models);
		this.sendJson(data,json,null);
		cb();
	}
	,getByIdStartsWith: function(data,provider,user,cb) {
		var _g = this;
		try {
			provider.getByIdStartsWith(data.id,data.field,Type.resolveClass(data.class_name),data.limit,function(objs,err) {
				var json = { };
				var i = saturn.client.core.CommonCore.releaseResource(provider);
				json.error = err;
				json.objects = objs;
				_g.sendJson(data,json,null);
				cb();
			});
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			saturn.client.core.CommonCore.releaseResource(provider);
			this.handleError(data,e);
			cb();
		}
	}
	,query: function(data,provider,user,cb) {
		var _g = this;
		try {
			var queryObj = data.queryObj;
			this.debug(Type.getClassName(queryObj == null?null:js.Boot.getClass(queryObj)));
			provider.query(queryObj,function(objs,err) {
				var json = { };
				var i = saturn.client.core.CommonCore.releaseResource(provider);
				json.error = err;
				json.objects = objs;
				_g.sendJson(data,json,null);
				cb();
			});
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			saturn.client.core.CommonCore.releaseResource(provider);
			saturn.core.Util.debug(e);
			this.handleError(data,e);
			cb();
		}
	}
	,getObjectIds: function(data,provider,user,cb) {
		var _g = this;
		try {
			provider.getByIds(data.ids,Type.resolveClass(data.class_name),function(objs,err) {
				var json = { };
				saturn.client.core.CommonCore.releaseResource(provider);
				json.error = err;
				json.objects = objs;
				_g.sendJson(data,json,null);
				cb();
			});
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			saturn.client.core.CommonCore.releaseResource(provider);
			this.sendError(data,e,null);
			cb();
		}
	}
	,getByValues: function(data,provider,user,cb) {
		var _g = this;
		try {
			provider.getByValues(data.values,Type.resolveClass(data.class_name),data.field,function(objs,err) {
				var json = { };
				saturn.client.core.CommonCore.releaseResource(provider);
				json.error = err;
				json.objects = objs;
				_g.sendJson(data,json,null);
				cb();
			});
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			saturn.client.core.CommonCore.releaseResource(provider);
			this.sendError(data,e,null);
			cb();
		}
	}
	,getByPkeys: function(data,provider,user,cb) {
		var _g = this;
		try {
			provider.getByPkeys(data.ids,Type.resolveClass(data.class_name),function(objs,err) {
				var json = { };
				saturn.client.core.CommonCore.releaseResource(provider);
				json.error = err;
				json.objects = objs;
				_g.sendJson(data,json,null);
				cb();
			});
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			saturn.client.core.CommonCore.releaseResource(provider);
			this.sendError(data,e,null);
			cb();
		}
	}
	,getByClass: function(data,provider,user,cb) {
		var _g = this;
		try {
			provider.getObjects(Type.resolveClass(data.class_name),function(objs,err) {
				var json = { };
				saturn.client.core.CommonCore.releaseResource(provider);
				json.error = err;
				json.objects = objs;
				_g.sendJson(data,json,null);
				cb();
			});
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			saturn.client.core.CommonCore.releaseResource(provider);
			this.sendError(data,e,null);
			cb();
		}
	}
	,getByNamedQuery: function(data,provider,user,cb) {
		var _g = this;
		try {
			this.debug("Start");
			var params = haxe.Unserializer.run(data.parameters);
			this.debug("End");
			if(data.queryId == "saturn.workflow") params[1].setRemote(true);
			params = this.autoCompleteFields(params,user);
			var clazz = null;
			if(data.class_name != null) clazz = Type.resolveClass(data.class_name);
			provider.getByNamedQuery(data.queryId,params,clazz,provider.getConfig().enable_cache,function(objs,err) {
				var json = { };
				saturn.client.core.CommonCore.releaseResource(provider);
				json.error = err;
				json.objects = objs;
				_g.sendJson(data,json,null);
				cb();
			});
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			saturn.client.core.CommonCore.releaseResource(provider);
			this.sendError(data,e,null);
			cb();
		}
	}
	,autoCompleteFields: function(params,user) {
		var retParams = [];
		if((params instanceof Array) && params.__enum__ == null) {
			var _g = 0;
			while(_g < params.length) {
				var paramSet = params[_g];
				++_g;
				var _g1 = 0;
				var _g2 = Reflect.fields(paramSet);
				while(_g1 < _g2.length) {
					var field = _g2[_g1];
					++_g1;
					if(field == "_username") {
						saturn.core.Util.debug("Setting username to " + user.username);
						paramSet._username = user.username;
					}
				}
				retParams.push(paramSet);
			}
			return retParams;
		} else return params;
	}
	,'delete': function(data,provider,user,cb) {
		var _g = this;
		try {
			var objs = this.convertJsonObjectArray(data.objs);
			provider._delete(objs,data.class_name,function(err) {
				var json = { };
				json.error = err;
				saturn.client.core.CommonCore.releaseResource(provider);
				_g.sendJson(data,json,null);
				cb();
			});
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			saturn.client.core.CommonCore.releaseResource(provider);
			this.sendError(data,e,null);
			cb();
		}
	}
	,insert: function(data,provider,user,cb) {
		var _g = this;
		var objs = this.convertJsonObjectArray(data.objs);
		provider._insert(objs,data.class_name,function(err) {
			var json = { };
			saturn.client.core.CommonCore.releaseResource(provider);
			js.Node.console.log("Returning from insert: " + err);
			if(err != null) _g.handleError(data,err,null); else _g.sendJson(data,json,null);
			cb();
		});
	}
	,update: function(data,provider,user,cb) {
		var _g = this;
		try {
			var objs = this.convertJsonObjectArray(data.objs);
			provider._update(objs,data.class_name,function(err) {
				var json = { };
				saturn.client.core.CommonCore.releaseResource(provider);
				json.error = err;
				_g.sendJson(data,json,null);
				cb();
			});
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			saturn.client.core.CommonCore.releaseResource(provider);
			this.sendError(data,e,null);
			cb();
		}
	}
	,commit: function(data,provider,user,cb) {
		var _g = this;
		try {
			provider.commit(function(err) {
				var json = { };
				saturn.client.core.CommonCore.releaseResource(provider);
				json.error = err;
				_g.sendJson(data,json,null);
				cb();
			});
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			saturn.client.core.CommonCore.releaseResource(provider);
			this.sendError(data,e,null);
			cb();
		}
	}
	,convertJsonObjectArray: function(jsonObjsStr) {
		var jsonObjs = JSON.parse(jsonObjsStr);
		var objs = [];
		var _g = 0;
		while(_g < jsonObjs.length) {
			var jsonObj = jsonObjs[_g];
			++_g;
			var obj = new haxe.ds.StringMap();
			var _g1 = 0;
			var _g2 = Reflect.fields(jsonObj);
			while(_g1 < _g2.length) {
				var field = _g2[_g1];
				++_g1;
				var value = Reflect.field(jsonObj,field);
				if(__map_reserved[field] != null) obj.setReserved(field,value); else obj.h[field] = value;
			}
			objs.push(obj);
		}
		return objs;
	}
	,uploadFile: function(data,provider,user,cb) {
		var _g = this;
		try {
			provider.uploadFile(data.contents,data.file_identifier,function(err,upload_id) {
				var json = { 'upload_id' : upload_id};
				saturn.client.core.CommonCore.releaseResource(provider);
				_g.sendJson(data,json,null);
				cb();
			});
		} catch( e ) {
			if (e instanceof js._Boot.HaxeError) e = e.val;
			saturn.client.core.CommonCore.releaseResource(provider);
			this.sendError(data,e,null);
			cb();
		}
	}
	,__class__: saturn.server.plugins.socket.core.RemoteProviderPlugin
});
saturn.server.plugins.socket.core.SocketIOException = $hxClasses["saturn.server.plugins.socket.core.SocketIOException"] = function(err) {
	saturn.util.HaxeException.call(this,err);
};
saturn.server.plugins.socket.core.SocketIOException.__name__ = ["saturn","server","plugins","socket","core","SocketIOException"];
saturn.server.plugins.socket.core.SocketIOException.__super__ = saturn.util.HaxeException;
saturn.server.plugins.socket.core.SocketIOException.prototype = $extend(saturn.util.HaxeException.prototype,{
	__class__: saturn.server.plugins.socket.core.SocketIOException
});
saturn.util.StringUtils = $hxClasses["saturn.util.StringUtils"] = function() { };
saturn.util.StringUtils.__name__ = ["saturn","util","StringUtils"];
saturn.util.StringUtils.getRepeat = function(txt,count) {
	var stringBuf_b = "";
	var _g = 0;
	while(_g < count) {
		var i = _g++;
		if(txt == null) stringBuf_b += "null"; else stringBuf_b += "" + txt;
	}
	return stringBuf_b;
};
saturn.util.StringUtils.reverse = function(txt) {
	var cols = txt.split("");
	cols.reverse();
	return cols.join("");
};
saturn.util.StringUtils.__super__ = StringTools;
saturn.util.StringUtils.prototype = $extend(StringTools.prototype,{
	__class__: saturn.util.StringUtils
});
if(!saturn.workflow) saturn.workflow = {};
saturn.workflow.Object = $hxClasses["saturn.workflow.Object"] = function() {
	this.remote = false;
};
saturn.workflow.Object.__name__ = ["saturn","workflow","Object"];
saturn.workflow.Object.prototype = {
	error: null
	,data: null
	,response: null
	,remote: null
	,setRemote: function(remote) {
		this.remote = remote;
	}
	,isRemote: function() {
		return this.remote;
	}
	,getParameter: function(param) {
		var data = this.getData();
		if(data != null && Object.prototype.hasOwnProperty.call(data,param)) return Reflect.field(data,param); else if(Object.prototype.hasOwnProperty.call(this,param)) return Reflect.field(this,param); else return null;
	}
	,setError: function(error) {
		saturn.core.Util.debug(error);
		this.error = error;
	}
	,getError: function() {
		return this.error;
	}
	,setData: function(data) {
		this.data = data;
	}
	,getData: function() {
		return this.data;
	}
	,getResponse: function() {
		return this.response;
	}
	,setResponse: function(resp) {
		this.response = resp;
	}
	,setup: function(cb) {
	}
	,__class__: saturn.workflow.Object
};
function $iterator(o) { if( o instanceof Array ) return function() { return HxOverrides.iter(o); }; return typeof(o.iterator) == 'function' ? $bind(o,o.iterator) : o.iterator; }
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
if(Array.prototype.indexOf) HxOverrides.indexOf = function(a,o,i) {
	return Array.prototype.indexOf.call(a,o,i);
};
$hxClasses.Math = Math;
String.prototype.__class__ = $hxClasses.String = String;
String.__name__ = ["String"];
$hxClasses.Array = Array;
Array.__name__ = ["Array"];
Date.prototype.__class__ = $hxClasses.Date = Date;
Date.__name__ = ["Date"];
var Int = $hxClasses.Int = { __name__ : ["Int"]};
var Dynamic = $hxClasses.Dynamic = { __name__ : ["Dynamic"]};
var Float = $hxClasses.Float = Number;
Float.__name__ = ["Float"];
var Bool = $hxClasses.Bool = Boolean;
Bool.__ename__ = ["Bool"];
var Class = $hxClasses.Class = { __name__ : ["Class"]};
var Enum = { };
if(Array.prototype.map == null) Array.prototype.map = function(f) {
	var a = [];
	var _g1 = 0;
	var _g = this.length;
	while(_g1 < _g) {
		var i = _g1++;
		a[i] = f(this[i]);
	}
	return a;
};
bindings.NodeFSExtra.fsExtra = require('fs-extra');
var NodePostgres = require('pg').Client;
bindings.NodeTemp.temp = require('temp');
var __map_reserved = {}
haxe.Serializer.USE_CACHE = false;
haxe.Serializer.USE_ENUM_INDEX = false;
haxe.Serializer.BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%:";
haxe.Unserializer.DEFAULT_RESOLVER = Type;
haxe.Unserializer.BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%:";
haxe.ds.ObjectMap.count = 0;
js.Boot.__toStr = {}.toString;
js.NodeC.UTF8 = "utf8";
js.NodeC.ASCII = "ascii";
js.NodeC.BINARY = "binary";
js.NodeC.BASE64 = "base64";
js.NodeC.HEX = "hex";
js.NodeC.EVENT_EVENTEMITTER_NEWLISTENER = "newListener";
js.NodeC.EVENT_EVENTEMITTER_ERROR = "error";
js.NodeC.EVENT_STREAM_DATA = "data";
js.NodeC.EVENT_STREAM_END = "end";
js.NodeC.EVENT_STREAM_ERROR = "error";
js.NodeC.EVENT_STREAM_CLOSE = "close";
js.NodeC.EVENT_STREAM_DRAIN = "drain";
js.NodeC.EVENT_STREAM_CONNECT = "connect";
js.NodeC.EVENT_STREAM_SECURE = "secure";
js.NodeC.EVENT_STREAM_TIMEOUT = "timeout";
js.NodeC.EVENT_STREAM_PIPE = "pipe";
js.NodeC.EVENT_PROCESS_EXIT = "exit";
js.NodeC.EVENT_PROCESS_UNCAUGHTEXCEPTION = "uncaughtException";
js.NodeC.EVENT_PROCESS_SIGINT = "SIGINT";
js.NodeC.EVENT_PROCESS_SIGUSR1 = "SIGUSR1";
js.NodeC.EVENT_CHILDPROCESS_EXIT = "exit";
js.NodeC.EVENT_HTTPSERVER_REQUEST = "request";
js.NodeC.EVENT_HTTPSERVER_CONNECTION = "connection";
js.NodeC.EVENT_HTTPSERVER_CLOSE = "close";
js.NodeC.EVENT_HTTPSERVER_UPGRADE = "upgrade";
js.NodeC.EVENT_HTTPSERVER_CLIENTERROR = "clientError";
js.NodeC.EVENT_HTTPSERVERREQUEST_DATA = "data";
js.NodeC.EVENT_HTTPSERVERREQUEST_END = "end";
js.NodeC.EVENT_CLIENTREQUEST_RESPONSE = "response";
js.NodeC.EVENT_CLIENTRESPONSE_DATA = "data";
js.NodeC.EVENT_CLIENTRESPONSE_END = "end";
js.NodeC.EVENT_NETSERVER_CONNECTION = "connection";
js.NodeC.EVENT_NETSERVER_CLOSE = "close";
js.NodeC.FILE_READ = "r";
js.NodeC.FILE_READ_APPEND = "r+";
js.NodeC.FILE_WRITE = "w";
js.NodeC.FILE_WRITE_APPEND = "a+";
js.NodeC.FILE_READWRITE = "a";
js.NodeC.FILE_READWRITE_APPEND = "a+";
js.Node.console = console;
js.Node.process = process;
js.Node.require = require;
js.Node.setTimeout = setTimeout;
js.Node.clearTimeout = clearTimeout;
js.Node.setInterval = setInterval;
js.Node.clearInterval = clearInterval;
js.Node.setImmediate = (function($this) {
	var $r;
	var version = HxOverrides.substr(js.Node.process.version,1,null).split(".").map(Std.parseInt);
	$r = version[0] > 0 || version[1] >= 9?js.Node.isNodeWebkit()?global.setImmediate:setImmediate:null;
	return $r;
}(this));
js.Node.clearImmediate = (function($this) {
	var $r;
	var version = HxOverrides.substr(js.Node.process.version,1,null).split(".").map(Std.parseInt);
	$r = version[0] > 0 || version[1] >= 9?js.Node.isNodeWebkit()?global.clearImmediate:clearImmediate:null;
	return $r;
}(this));
js.Node.global = global;
js.Node.module = js.Node.isNodeWebkit()?global.module:module;
js.Node.stringify = JSON.stringify;
js.Node.parse = JSON.parse;
saturn.app.SaturnServer.DEBUG = (js.Node.require("debug"))("saturn:server");
saturn.client.core.CommonCore.pools = new haxe.ds.StringMap();
saturn.client.core.CommonCore.resourceToPool = new haxe.ds.ObjectMap();
saturn.client.core.CommonCore.providers = new haxe.ds.StringMap();
saturn.core.molecule.Molecule.newLineReg = new EReg("\n","g");
saturn.core.molecule.Molecule.carLineReg = new EReg("\r","g");
saturn.core.molecule.Molecule.whiteSpaceReg = new EReg("\\s","g");
saturn.core.molecule.Molecule.reg_starReplace = new EReg("\\*","");
saturn.core.StandardGeneticCode.instance = new saturn.core.StandardGeneticCode();
saturn.core.StandardGeneticCode.standardTable = saturn.core.StandardGeneticCode.instance.getCodonLookupTable();
saturn.core.StandardGeneticCode.aaToCodon = saturn.core.StandardGeneticCode.instance.getAAToCodonTable();
saturn.core.GeneticCodeRegistry.CODE_REGISTRY = new saturn.core.GeneticCodeRegistry();
saturn.core.Util.fs = js.Node.require("fs");
saturn.core.Util.temp = js.Node.require("temp");
saturn.core.Util.split = js.Node.require("split");
saturn.core.molecule.MoleculeConstants.aMW = 331.2;
saturn.core.molecule.MoleculeConstants.tMW = 322.2;
saturn.core.molecule.MoleculeConstants.gMW = 347.2;
saturn.core.molecule.MoleculeConstants.cMW = 307.2;
saturn.core.molecule.MoleculeConstants.aChainMW = 313.2;
saturn.core.molecule.MoleculeConstants.tChainMW = 304.2;
saturn.core.molecule.MoleculeConstants.gChainMW = 329.2;
saturn.core.molecule.MoleculeConstants.cChainMW = 289.2;
saturn.core.molecule.MoleculeConstants.O2H = 18.02;
saturn.core.molecule.MoleculeConstants.OH = 17.01;
saturn.core.molecule.MoleculeConstants.PO3 = 78.97;
saturn.core.molecule.MoleculeSetRegistry.defaultRegistry = new saturn.core.molecule.MoleculeSetRegistry();
saturn.db.DefaultProvider.r_date = new EReg("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.000Z","");
saturn.db.query_lang.SQLVisitor.injection_check = new EReg("^([A-Za-z0-9\\.])+$","");
saturn.app.SaturnServer.main();
