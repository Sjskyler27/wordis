
export function hideGoogleTranslateIframesAfterDelay(time = 0) {
  setTimeout(() => {
    const iframes = document.getElementsByTagName('iframe');
    for (let i = 0; i < iframes.length; i++) {
      const iframe = iframes[i];
      if (iframe.className.includes('skiptranslate')) {
        iframe.style.display = 'none';
        console.log('Hid Google Translate iframe:', iframe);
      }
    }
    document.body.style.top = '0px';
  }, time); // Wait 10 seconds
}

export function hideGoogleTranslateExtras() {
  // Hide any Google Translate loader or overlay
  // This hides three things the big overlay, the language drop down, and the blue hover on any text! 
  // I beleive it only hides things while they exist... so the blue background being removed should be fine 
  
  // carefull any text hovered over will get this styling 
  const divs = document.querySelectorAll('div[class*="skiptranslate"], div[class*="VIpgJd"]');
  divs.forEach(div => {
    div.style.display = 'none';
    div.style.border = 'none';
    div.style.backgroundColor = 'transparent'; 
    div.style.boxShadow = 'none'; 
  });
}
export function unhideGoogleTranslateExtras() {
  // carefull any text hovered over will get this styling 

  const languageDiv = document.querySelectorAll('div[class*="skiptranslate"], div[class*="VIpgJd-ZVi9od-xl07Ob-lTBxed"]');
  const overlayDiv = document.querySelectorAll('div[class*="VIpgJd-yAWNEb-L7lbkb"]')
  // console.log(languageDiv)
  // console.log(overlayDiv)

  // target the little language drop down and show it again 
  languageDiv.forEach(div => {
    div.style.display = 'block';
    div.style.color = 'white'
    div.style.border = 'none';
    div.style.backgroundColor = 'transparent'; 
    div.style.boxShadow = 'none'; 
  });

  // target the overlay and hide it. 
  overlayDiv.forEach(div => {
    div.style.display = 'none';
    div.style.color = 'red'
    div.style.border = 'none';
    div.style.backgroundColor = 'transparent'; 
    div.style.boxShadow = 'none'; 
  });
}
