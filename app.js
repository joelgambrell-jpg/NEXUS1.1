(function(){
const p=new URLSearchParams(location.search),id=p.get("id");
if(!id||!window.FORMS[id]){document.body.innerHTML='<div style="background:#b60000;color:white;padding:40px;font-family:Arial"><h2>Invalid or missing form ID</h2><p>Use ?id=lvt or ?id=rif</p></div>';return;}
const c=window.FORMS[id];
document.title=c.title;
document.getElementById("page-title").textContent=c.title;
document.getElementById("section-title").textContent=c.sectionTitle;
document.body.style.backgroundImage=`url("${c.backgroundImage}")`;
const b=document.getElementById("buttons");b.innerHTML="";
c.buttons.forEach(x=>{const a=document.createElement("a");a.className="btn";a.textContent=x.text;a.href=x.href;a.target="_blank";a.rel="noopener noreferrer";a.onclick=()=>localStorage.setItem(c.completedKey,"true");b.appendChild(a);});
})();