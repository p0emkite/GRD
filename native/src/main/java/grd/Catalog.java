package grd;
import java.io.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

public final class Catalog {
 public record Skill(String name,String kind,int every,double power,double radius){}
 public record Group(String id,String name,List<String> members,String role,String color,String generation,String agency,String photo,String logo,String reveal,String audio,Double damage,Double interval,Double range,Skill skill){}
 public record Wave(double hp,double speed,int count){}
 public final List<Group> groups; public final Map<String,String> photos; public final Map<String,Object> waves,profiles,raw;
 public final String source;
 private Catalog(Map<String,Object> m,Map<String,Object> base,String source){
  this.source=source; waves=obj(base.get("sourceWaves"));profiles=obj(base.get("originalProfiles"));raw=obj(base.get("originalGroupRaw"));photos=new HashMap<>();obj(m.get("memberPhotos")).forEach((k,v)->photos.put(k,asset(v)));
  List<Group> list=new ArrayList<>();Set<String> ids=new HashSet<>();
  Map<String,Group> defaults=new HashMap<>(); if(m!=base)for(Group g:new Catalog(base,base,"bundled").groups)defaults.put(g.id,g);
  for(Object o:arr(m.get("groups"))){Map<String,Object> g=obj(o),c=obj(g.get("combat")),s=obj(c.get("skill"));String id=str(g,"id"),name=str(g,"name");List<String> ms=arr(g.get("members")).stream().map(Object::toString).distinct().toList();if(!id.matches("[a-z0-9][a-z0-9_-]{0,63}")||!ids.add(id)||name.isBlank()||ms.isEmpty()||ms.size()>50)throw new IllegalArgumentException("Invalid catalog");
   Group d=defaults.get(id);String role=str(g,"role");Skill skill=s.isEmpty()?(d==null?generic(role):d.skill):new Skill(str(s,"name"),str(s,"kind"),Math.max(2,(int)num(s,"every",5)),num(s,"power",1.5),num(s,"radius",110));
   list.add(new Group(id,name,ms,role,str(g,"color"),str(g,"generation"),str(g,"agency"),asset(g.get("photo")),asset(g.get("logo")),asset(g.get("reveal")),asset(g.get("audio")),opt(c,"damage"),opt(c,"interval"),opt(c,"range"),skill));
  } if(list.isEmpty()||list.size()>500)throw new IllegalArgumentException("Empty or oversized catalog");groups=List.copyOf(list);
 }
 static Skill generic(String role){return switch(role){case "광역"->new Skill("ENCORE","blast",5,1.2,110);case "감속"->new Skill("SPOTLIGHT","freeze",5,1.1,100);case "지원"->new Skill("CHEER","cheer",5,1.25,110);case "저격"->new Skill("FINALE","pierce",5,2.1,110);default->new Skill("SHOWTIME","critical",5,2,110);};}
 public static Catalog bundled(){try{Map<String,Object> m=obj(Json.parse(resource("catalog.json")));return new Catalog(m,m,"OFFLINE CATALOG");}catch(Exception e){throw new IllegalStateException(e);}}
 public static Catalog online(){try{Map<String,Object> base=obj(Json.parse(resource("catalog.json")));Properties p=new Properties();try(InputStream in=Catalog.class.getResourceAsStream("/cloud.properties")){p.load(in);}
  HttpRequest req=HttpRequest.newBuilder(URI.create(p.getProperty("url")+"/rest/v1/grd_catalog?id=eq.1&select=payload,revision")).header("apikey",p.getProperty("publishableKey")).timeout(Duration.ofSeconds(6)).build();
  HttpResponse<String> res=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build().send(req,HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));if(res.statusCode()!=200||res.body().length()>8_000_000)throw new IOException("catalog unavailable");
  Map<String,Object> row=obj(arr(Json.parse(res.body())).get(0));return new Catalog(obj(row.get("payload")),base,"LIVE CATALOG r"+row.get("revision"));
 }catch(Exception e){return bundled();}}
 public Wave wave(int w,double multiplier){int n=Math.min(30,Math.max(1,w));Map<String,Object> a=obj(waves.get("girl")),b=obj(waves.get("card"));List<Object> x=arr(a.getOrDefault(""+n,a.get(""+(n-1)))),y=arr(b.getOrDefault(""+n,b.get(""+(n-1))));double hp=Math.round(Math.sqrt((number(x.get(0))+number(x.get(1)))*(number(y.get(0))+number(y.get(1))))*.55*multiplier*Math.pow(1.13,Math.min(100,Math.max(0,w-30))));return new Wave(Math.max(1,Math.round(hp)),Math.round(45+(number(x.get(4))+number(y.get(4)))/2*8),w<15?36:44);}
 static String asset(Object v){if(!(v instanceof String s)||s.length()>4_000_000)return "";if(s.startsWith("https://")||s.startsWith("http://")){try{URI u=URI.create(s);if(u.getUserInfo()==null&&u.getHost()!=null)return s;}catch(Exception ignored){}}if(s.startsWith("assets/")&&!s.contains(".."))return "https://p0emkite.github.io/GRD/"+s;return "";}
 static String resource(String f)throws IOException{try(InputStream in=Catalog.class.getResourceAsStream("/"+f)){if(in==null)throw new IOException(f);return new String(in.readAllBytes(),StandardCharsets.UTF_8);}}
 @SuppressWarnings("unchecked") static Map<String,Object> obj(Object o){return o instanceof Map?(Map<String,Object>)o:Map.of();}
 @SuppressWarnings("unchecked") static List<Object> arr(Object o){return o instanceof List?(List<Object>)o:List.of();}
 static String str(Map<String,Object> m,String k){return m.get(k) instanceof String s?s:"";}
 static double number(Object v){return v instanceof Number n?n.doubleValue():0;}
 static double num(Map<String,Object> m,String k,double d){return m.get(k) instanceof Number n&&Double.isFinite(n.doubleValue())?n.doubleValue():d;}
 static Double opt(Map<String,Object> m,String k){return m.get(k) instanceof Number n&&n.doubleValue()>0&&Double.isFinite(n.doubleValue())?n.doubleValue():null;}
 static final class Json{
  final String s;int p;Json(String s){this.s=s;}
  static Object parse(String s){Json j=new Json(s);Object o=j.value(0);j.ws();if(j.p!=s.length())throw new IllegalArgumentException("Trailing JSON");return o;}
  void ws(){while(p<s.length()&&Character.isWhitespace(s.charAt(p)))p++;}
  boolean eat(char c){ws();if(p<s.length()&&s.charAt(p)==c){p++;return true;}return false;}
  void need(char c){if(!eat(c))throw new IllegalArgumentException("Expected "+c);}
  Object value(int depth){if(depth>100)throw new IllegalArgumentException("JSON depth");ws();char c=s.charAt(p);if(c=='{'){p++;Map<String,Object> m=new LinkedHashMap<>();if(!eat('}')){do{String k=string();need(':');m.put(k,value(depth+1));}while(eat(','));need('}');}return m;}if(c=='['){p++;List<Object> a=new ArrayList<>();if(!eat(']')){do{a.add(value(depth+1));}while(eat(','));need(']');}return a;}if(c=='"')return string();for(String token:List.of("true","false","null"))if(s.startsWith(token,p)){p+=token.length();return token.equals("null")?null:Boolean.valueOf(token);}int start=p;while(p<s.length()&&"-+0123456789.eE".indexOf(s.charAt(p))>=0)p++;return Double.parseDouble(s.substring(start,p));}
  String string(){need('"');StringBuilder b=new StringBuilder();while(p<s.length()){char c=s.charAt(p++);if(c=='"')return b.toString();if(c=='\\'){c=s.charAt(p++);switch(c){case 'u'-> {b.append((char)Integer.parseInt(s.substring(p,p+4),16));p+=4;}case 'n'->b.append('\n');case 'r'->b.append('\r');case 't'->b.append('\t');case 'b'->b.append('\b');case 'f'->b.append('\f');default->b.append(c);}}else b.append(c);}throw new IllegalArgumentException("Unterminated string");}
 }
}
