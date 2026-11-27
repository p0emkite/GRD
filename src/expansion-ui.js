'use strict';
let detailAnchor=null,venueSerial=0;
function openMobileDetail(){if(state.setup||state.done||state.paused)return;const dialog=$('mobileDetailDialog'),detail=$('detail');if(dialog.open)return;detailAnchor=document.createComment('detail');detail.before(detailAnchor);$('mobileDetailHost').append(detail);dialog.showModal();render()}
function closeMobileDetail(){if(detailAnchor){detailAnchor.replaceWith($('detail'));detailAnchor=null;render()}}
function venuePath(){return 'assets/encore/'+({broadcast:'broadcast.svg',awards:'awards.svg'}[prefs.venueSkin]||'venue.svg')}
async function loadVenueSkin(){const serial=++venueSerial;void requestPremiumStage();try{const art=await loadArt(venuePath());if(serial!==venueSerial)return;venueArt=art;stageBackdrop=null}catch{}}
function initExpansionUI(){$('mobileDetailDialog').addEventListener('close',closeMobileDetail);loadVenueSkin()}
