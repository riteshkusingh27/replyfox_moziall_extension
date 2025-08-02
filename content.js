console.log("Running");

function createCustomButton() {
  const button = document.createElement("div");
  button.className = "T-I J-J5-Ji aoO v7 T-I-atl L3 ai-reply";
  button.style.marginRight = "8px";
  button.style.borderRadius = "4px";
  button.style.backgroundColor = "#0b57d0";
  button.innerHTML = "AI Reply";
  button.setAttribute("role", "button");
  button.setAttribute("data-tooltip", "Generate Reply ");

  return button;
}
function getEmailContent() {
  const Selectors = [
    ".h7",
    ".a3s.aiL.ltr",
    '[role="toolbar"]',
    ".gmail_quote",
    '[role="presentation"]',
  ];
  for (const sel of Selectors) {
    const content = document.querySelector(sel);
    if (content) {
      return content.innerText.trim();
    }
  }
}

function findComposeToolbar() {
  const Selectors = [
    // Gmail Compose Window Classes (Most specific first)
    ".btC",           // Main compose window
    ".aDh",           // Compose dialog 
    ".aDg",           // Compose container
    ".aDj",           // Compose area
    ".IZ",            // Message compose
    
    // Toolbar specific
    '[role="group"]', // Button groups in compose
    ".gU.Up",         // Compose toolbar
    ".J-Z-I",         // Send button area parent
    ".T-I-J3",        // Button container
    
    // Content areas that might contain toolbars
    ".Am",            // Message body area
    ".Ar.Au",         // Compose window content
    ".aoP",           // Compose form
    ".aO9",           // Compose elements
    
    // Fallbacks
    ".editable",
    ".LW-avf",
    ".tS-tW"
  ];
  
  for (const sel of Selectors) {
    const content = document.querySelector(sel);
    if (content) {
      console.log("yes");
      return content;
    }
  }
  console.log("No toolbar found with any selector");
  return null;
}
function injectButton() {
  // remove already injected buttton
  const existingButton = document.querySelector(".ai-reply");
  if (existingButton) existingButton.remove();
  const toolbar = findComposeToolbar();
  if (!toolbar) {
    console.log("Toolbar not found");
    return;
  }
  console.log("toolbar found ");

  // create custome button 
  const button = createCustomButton();
  button.addEventListener("click", async () => {
    // backend api call
    try {
      button.innerHTML = "Generating....";
      button.disabled = true;

      const emailContent = getEmailContent();
      const response = await fetch(
        "https://emailassistantapi-production.up.railway.app/api/v1/generate-mail",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emailContent: emailContent,
            tone: "professional",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("API request failed ");
      }
      const reply = await response.text();
      
      // Try multiple Gmail compose box selectors
      const composeSelectors = [
        '[role="textbox"][g_editable="true"]',
        '[g_editable="true"][role="textbox"]', 
        '[contenteditable="true"][role="textbox"]',
        '.editable[g_editable="true"]',
        '.Am.Al.editable',
        '[g_editable="true"]',
        '[contenteditable="true"]',
        '.Am[contenteditable="true"]'
      ];
      
      let ComposeBox = null;
      for(const selector of composeSelectors) {
        ComposeBox = document.querySelector(selector);
        if(ComposeBox) {
          console.log(`✅ Found compose box with: ${selector}`);
          break;
        }
      }
      
      if (ComposeBox) {
        ComposeBox.focus();

        // No undo support - Can't undo the change if used innerText of innerHTML
        document.execCommand("insertText", false, reply);
      } else {
        console.error("compose box was not found ");
      }
    } catch (error) {
      alert("failed generating content");
    } finally {
      button.innerHTML = "AI Reply ";
      button.disabled = false;
    }
  });
  toolbar.insertBefore(button, toolbar.firstChild);
}

const observer = new MutationObserver((mutations) => {
  // list of changes of occured in the browser
  for (const mutation of mutations) {
    // whenever the nodes are updates the changes are captures inot addednodes in arrray form
    const addedNodes = Array.from(mutation.addedNodes);
    const hasComposedNodes = addedNodes.some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE &&
        (node.matches('.aDh,.btC,[role="dialog"]') || 
         node.querySelector('.aDh,.btC,[role="dialog"]'))
    );

    if (hasComposedNodes) {
      console.log("compose window detected");
      setTimeout(injectButton, 500);
    }
  }
});

observer.observe(document.body, {
  // observers direct changes of chilidren
  childList: true,
  // observers al the deepnested mutation
  subtree: true,
});
