/* InDesign uses the same Hrmnx Messages service as Nemawashi. */
(function(){
"use strict";
window.indesignMessages={
 render:function(target){
  if(window.HrmnxMessaging){window.HrmnxMessaging.render(target,"personal");return;}
  target.innerHTML='<div class="empty-state"><strong>Messages could not be loaded.</strong><p>Refresh the page and try again.</p></div>';
 }
};
})();