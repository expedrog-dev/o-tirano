// Visual presentation only. Story, progression and dialogue data stay in event sheets.
runOnStartup(runtime => {
 const first=n=>runtime.objects[n]?.getFirstInstance();
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 let tracked=null,lastX=0,lastY=0,direction='Baixo',moving=false;
 function prepare(){
  tracked=null;moving=false;direction='Baixo';
  for(const type of Object.values(runtime.objects)) for(const obj of type.getAllInstances())
   if('fontFace' in obj)obj.fontFace='PedroHand-Regular';
  const box=first('CaixaDialogo');if(!box)return;
  for(const n of ['CaixaDialogo','NomeDialogo','FalaDialogo','textoInteracao']){
   const obj=first(n);if(!obj)continue;
   if(obj.layer!==box.layer)obj.moveToLayer(box.layer);
   obj.setOrigin(0,0);obj.angle=0;
  }
  first('NomeDialogo')?.moveToTop();first('FalaDialogo')?.moveToTop();first('textoInteracao')?.moveToTop();
 }
 function blockMovement(){
  const p=first('Édipo');if(!p)return;
  if(runtime.globalVars.DialogoAtivo || runtime.globalVars.EnigmaAtivo)p.behaviors['8Direções'].stop();
 }
 function animate(){
  const p=first('Édipo');if(!p)return;
  const b=p.behaviors['8Direções'];
  if(p!==tracked){tracked=p;lastX=p.x;lastY=p.y;p.setAnimation('AndarBaixo');p.stopAnimation();p.animationFrame=1;}
  const dx=p.x-lastX,dy=p.y-lastY;lastX=p.x;lastY=p.y;
  const blocked=runtime.globalVars.DialogoAtivo || runtime.globalVars.EnigmaAtivo || !b.isEnabled;
  if(blocked)b.stop();
  const isMoving=!blocked && b.speed>1 && Math.hypot(dx,dy)>0.03;
  if(isMoving){
   const next=Math.abs(b.vectorX)>Math.abs(b.vectorY)?(b.vectorX<0?'Esquerda':'Direita'):(b.vectorY<0?'Cima':'Baixo');
   if(next!==direction || !moving){direction=next;p.setAnimation('Andar'+direction);p.startAnimation('beginning');}
   p.animationSpeed=8;
  }else {p.stopAnimation();p.animationFrame=1;}
  p.angle=0;moving=isMoving;
 }
 function present(){
  const vars=runtime.globalVars,p=first('Édipo');
  const fade=first('FadePreto');
  if(fade){const v=fade.layer.getViewport();fade.setOrigin(0,0);fade.angle=0;fade.setPosition(v.left-2,v.top-2);fade.setSize((v.width+8)*250/175,(v.height+8)*250/183);fade.moveToTop();}
  const final=first('TextoFinal');
  if(final){const v=final.layer.getViewport();final.setPosition(v.left+120,v.bottom-150);final.setSize(v.width-240,110);final.fontColor=[1,.94,.77];final.sizePt=25;}
  const blind=first('EdipoCego');
  if(blind && p && vars.RevelacaoFinal && !blind.isVisible){blind.setPosition(p.x,p.y+p.height*.30-blind.height*.47);}
  for(const wall of runtime.objects.ParedeTeste.getAllInstances()){
   if(wall.hasTag('PortaoEsfinge'))wall.behaviors['Sólido'].isEnabled=!vars.EsfingeDerrotada;
  }
  const box=first('CaixaDialogo'),name=first('NomeDialogo'),speech=first('FalaDialogo');
  if(!box || !name || !speech)return;
  const hint=first('textoInteracao'),back=first('CaixaDialogo2');
  const view=box.layer.getViewport(),w=Math.min(840,view.width-64),h=w/3;
  const left=view.left+(view.width-w)/2,top=view.bottom-h-24;
  box.setPosition(left,top);box.setSize(w,h);
  name.setPosition(left+w*.135,top+h*.112);name.setSize(w*.27,h*.15);
  name.sizePt=17;name.fontColor=[1,.94,.77];
  speech.setPosition(left+w*.075,top+h*.30);speech.setSize(w*.85,h*(vars.EnigmaAtivo?.23:.45));
  speech.sizePt=vars.EnigmaAtivo?17:21;speech.lineHeight=0;speech.fontColor=[.13,.10,.07];
  box.isVisible=name.isVisible=speech.isVisible=!!(vars.DialogoAtivo || vars.EnigmaAtivo);
  if(vars.EnigmaAtivo){name.text='Esfinge';speech.text='Qual criatura anda com quatro pés pela manhã, dois ao meio-dia e três ao anoitecer?';}
  else if(!vars.DialogoAtivo){name.text='';speech.text='';}
  for(let i=1;i<=3;i++){
   const a=first('Resposta'+i);if(!a)continue;
   a.setOrigin(0,0);a.setPosition(left+w*(.075+(i-1)*.29),top+h*.57);a.setSize(w*.28,38);a.sizePt=18;a.fontColor=[.13,.10,.07];a.isVisible=!!vars.EnigmaAtivo;
  }
  const feedback=first('FeedbackEnigma');
  if(feedback){feedback.setOrigin(0,0);feedback.setPosition(left+w*.075,top+h*.73);feedback.setSize(w*.80,40);feedback.sizePt=15;feedback.fontColor=[.50,.13,.05];if(!vars.EnigmaAtivo){feedback.isVisible=false;feedback.text='';}}
  if(!hint || !back)return;
  const eligible=n=>{const id=n.instVars.DialogoID;return id===3?vars.Investigacaoiniciada:id===4?vars.PistaLaioLiberada:id===5?vars.SuspeitaEdipo:id===7?vars.JocastaConcluida:true;};
  const npc=p?runtime.objects.Interagivel.getAllInstances().filter(eligible).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]:null;
  const show=!!npc && Math.hypot(npc.x-p.x,npc.y-p.y)<=(npc.instVars.DialogoID===1?350:145) && !vars.DialogoAtivo && !vars.EnigmaAtivo && !vars.RevelacaoFinal;
  hint.isVisible=back.isVisible=show;hint.text=show?'Aperte E para interagir':'';
  if(show){
   const world=npc.layer.getViewport();
   const x=clamp(view.left+(npc.x-world.left)/world.width*view.width-150,view.left+20,view.right-320);
   const y=clamp(view.top+(npc.y-world.top)/world.height*view.height-150,view.top+20,view.bottom-120);
   back.setOrigin(0,0);back.setPosition(x,y);back.setSize(300,100);back.moveToTop();
   hint.setOrigin(0,0);hint.setPosition(x+27,y+40);hint.setSize(250,36);hint.fontFace='PedroHand-Regular';hint.sizePt=15;hint.fontColor=[.13,.10,.07];hint.opacity=1;hint.moveToTop();
  }
 }
 runtime.addEventListener('beforeprojectstart',prepare);
 runtime.addEventListener('afteranylayoutstart',prepare);
 runtime.addEventListener('pretick',blockMovement);
 runtime.addEventListener('tick2',()=>{blockMovement();animate();present();});
});
