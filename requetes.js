//=======================================================
// CODE Pour écran REQUETES
//=======================================================

let gStatusRequete = 99;
let gHtmlText = "";

//-------------------------------------------------------
// Afficher l'écran scrReq
//-------------------------------------------------------
function AfficherEcranREQ()
{
  // Compte le nombre de requêtes mémorisées
  let lReq = localStorage.getItem('RequetesVisuGPX');
  let lNbReq = 0;
  if (lReq != null)
  {
    lNbReq = CompteRequetes(lReq); // TODO
  }
  else
    lNbReq = 0;

  // Il y a des requêtes à envoyer
  if (lNbReq > 0)
  {
    pid('BarreReqHaut').style.backgroundColor = '#F00';
    pid('BarreReqHaut').style.color = 'white';
    pid('TxtReqNb').innerHTML = "Nombre de requêtes en cours : <b>" + lNbReq + "</b>";
    pid('DivRequetes').style.display = 'block';
  }

  // Pas de requêtes à envoyer
  else
  {
    pid('BarreReqHaut').style.backgroundColor = '#0F0';
    pid('BarreReqHaut').style.color = 'black';
    pid('TxtReqNb').innerHTML = "Aucune requête à envoyer";
    pid('DivRequetes').style.display = 'none';
  }

  pid('TxtEnvoiRequetesStatut').innerHTML = "";
  pid('scrReq').style.display = 'block';
}

//-------------------------------------------------------
// Compte le nombre de requêtes
//-------------------------------------------------------
function CompteRequetes(pRequetes)
{
  let lNbReq = 0;
  for (const lCar of pRequetes)
  {
    if (lCar === "¶")
      lNbReq++;
  }
  return(lNbReq);
}

//--------------------------------------------------------------------------------------------------
// Demande d'effacement des requêtes
//--------------------------------------------------------------------------------------------------
function ButClearRequetesClicked()
{
  localStorage.setItem('RequetesVisuGPX', "");

  // On réaffiche l'écran pour la gestion du texte et des boutons
  AfficherEcranREQ();
}

//--------------------------------------------------------------------------------------------------
// Envoi des requêtes mémorisées
//--------------------------------------------------------------------------------------------------
async function ButEnvoiRequetesClicked()
{
  pid('TxtEnvoiRequetesStatut').innerHTML = "Envoi en cours ..<br>";
  let lConnecte = IsConnected();

  // Pas connecté au réseau
  if (!lConnecte)
  {
      pid('TxtEnvoiRequetesStatut').innerHTML+= "Pas de connexion réseau !";
  }

  // On est connecté au réseau
  else
  {
    // Compte le nombre de requêtes mémorisées
    let lReq = localStorage.getItem('RequetesVisuGPX');
    let lNbReq = 0;
    if (lReq != null)
    {
      lNbReq = CompteRequetes(lReq);
    }
    else
      lNbReq = 0;

    // S'il y a des requêtes à envoyer
    if (lNbReq > 0)
    {
      // Diviser les requêtes si elles sont concaténées avec "¶" comme séparateur
      const requetesArray = lReq.split("¶").filter(req => req.trim() !== '');

      //----- Boucle sur toutes les requêtes mémorisées -----
      let lRequetesEnvoyees = 0;
      for (const singleReq of requetesArray)
      {
        // S'assurer que c'est une URL valide
        if (singleReq.startsWith("https://www.visugpx.com/"))
        {
          // Fetch
          FetchCors(singleReq);

          // Boucle d'attente
          for (let lCount = 0; lCount < 50; lCount++)
          {
            await sleep(200);
            if (gStatusRequete < 50)
              break;
          }

          // Vérifie la valeur de retour
          if (gStatusRequete == 0)
          {
          if (gHtmlText.startsWith("Succes"))
            lRequetesEnvoyees++;
          }
        }
      }

      // Statut après toutes les requêtes envoyées
      if (lRequetesEnvoyees == lNbReq)
      {
        pid('BarreReqHaut').style.backgroundColor = '#0F0';
        pid('BarreReqHaut').style.color = 'black';
        pid('TxtReqNb').innerHTML = "Aucune requête à envoyer";
        pid('DivRequetes').style.display = 'none';

        // Toutes envoyées donc on efface la mémoire
        localStorage.setItem('RequetesVisuGPX', "");
      }

      // Au moins une erreur, on n'efface par le buffer, tant pis pour les doublons
      else
      {
        const lErreurs = lNbReq - lRequetesEnvoyees;
        pid('TxtEnvoiRequetesStatut').innerHTML += S("<b>", lErreurs, "</b> Erreur") + "<br>";
        if (gHtmlText.startsWith("Err: Fichier non trouvé"))
          pid('TxtEnvoiRequetesStatut').innerHTML += "<i>Vérifier l'ID VisuGPX</i>";
        else if (gHtmlText.startsWith("Err: La trace doit être cachée"))
          pid('TxtEnvoiRequetesStatut').innerHTML += "<i>Modifier le type de la trace en 'Cachée'</i>";
        else
          pid('TxtEnvoiRequetesStatut').innerHTML += "<i>" + gHtmlText + "</i>";
      }
    }

    // Pas de requête à envoyer
    else
    {
        pid('BarreReqHaut').style.backgroundColor = '#0F0';
        pid('BarreReqHaut').style.color = 'black';
        pid('TxtReqNb').innerHTML = "Aucune requête à envoyer";
        pid('DivRequetes').style.display = 'none';
    }
  }
}

//--------------------------------------------------------------------------------------------------
// Envoi des requêtes à partir du FIFO
//--------------------------------------------------------------------------------------------------
async function EnvoiRequetes()
{
    let lConnecte = IsConnected();

    // Pas connecté au réseau
    if (!lConnecte)
    {
        pid("Step3").style.backgroundColor = ColErreur;
        pid('TxtStep3').innerHTML = "<b>Envoi</b><br>Pas de connexion réseau";
    }

    // On est connecté au réseau
    else
    {
        // Compte le nombre de requêtes mémorisées
        let lNbReq = CountFIFO();

        // S'il y a des requêtes à envoyer
        if (lNbReq > 0)
        {
            pid("Step3").style.backgroundColor = ColEnCours;
            pid('TxtStep3').innerHTML  = "<b>Envoi</b><br>";
            pid('TxtStep3').innerHTML += S("Envoi de <b>", lNbReq, "</b> requête") + "..";

            //----- Boucle sur toutes les requêtes mémorisées -----
            let lRequetesEnvoyees = 0;
            for (let n = 1; n <= lNbReq; n++)
            {
                const singleReq = PeekFIFO();   // Lecture sans suppression
                const lRet = await EnvoiSingleRequete(singleReq);

                // Vérifie la valeur de retour. Si OK, on supprime
                if (lRet == "OK")
                {
                  lRequetesEnvoyees++;
                  PopFIFO();
                }
            }

            // Statut après toutes les requêtes envoyées
            if (lRequetesEnvoyees == lNbReq)
            {
                pid("Step3").style.backgroundColor = ColOK;
                pid('TxtStep3').innerHTML = "<b>Envoi</b><br>"
                pid('TxtStep3').innerHTML += S("<b>", lNbReq, "</b> requête") + S(" ", lNbReq, " envoyée") + "<br>";

                // Chargement du bulletin météo
                pid("Step4").style.backgroundColor = ColEnCours;;
                await sleep(500);

                // Charge sans l'afficher
                gLatitudeMeteo = gGeoLatitude;
                gLongitudeMeteo = gGeoLongitude;
                gEmplacementMeteo = gGeoEmplacement;
                DownloadBulletin(false);

                pid("Step4").style.backgroundColor = ColOK;
                pid('TxtStep4').innerHTML += "Chargé";
            }

            // Au moins une erreur, les requêtes non envoyées n'ont pas été effacées
            else
            {
                const lErreurs = lNbReq - lRequetesEnvoyees;
                pid("Step3").style.backgroundColor = ColErreur;
                pid('TxtStep3').innerHTML = "<b>Envoi</b><br>";
                pid('TxtStep3').innerHTML += S("<b>", lErreurs, "</b> Erreur") + "<br>";
            }
        }

        // Pas de requête à envoyer
        else
        {
            pid("Step3").style.backgroundColor = ColInactif;
            pid('TxtStep3').innerHTML = "<b>Envoi</b><br>";
            pid('TxtStep3').innerHTML += "Aucune requête à envoyer";
        }
    }
}


//--------------------------------------------------------------------------------------------------
// Fetch en mode CORS pour récuperer le contenu d'une URL
// Si < 50, alors erreur et on arrête
//--------------------------------------------------------------------------------------------------
async function FetchCors(url)
{
  gStatusRequete = 99;
  try {
    const response = await fetch(url, { method: 'GET', mode: 'cors' });

    if (!response.ok)
    {
      gStatusRequete = 1;
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    gStatusRequete = 98;
    gHtmlText = await response.text(); // Attend que le texte soit lu
    gStatusRequete = 0;
  }
  catch (error)
  {
    gStatusRequete = 2;
  }
}

//--------------------------------------------------------------------------------------------------
// Ajoute un 's' ou non à un texte
// avantTexte peut servir à ajouter un formatage
// Exemple S("<b>", second, "</b> secondes")
//--------------------------------------------------------------------------------------------------
function S(avantTexte, nombre, apresTexte)
{
  let textefinal = avantTexte + nombre + apresTexte;
  if (nombre > 1)
    textefinal += "s";
  return(textefinal);
}

//--------------------------------------------------------------------------------------------------
// Fermeture de cet écran
//--------------------------------------------------------------------------------------------------
function ButReqRetourClick()
{
  pid('scrReq').style.display = 'none';
  AfficherEcranHOME();
}


//=======================================================
// GESTION FIFO (LocalStorage)
//=======================================================

const STORAGE_KEY_FIFO = 'RequetesFIFO';


//--------------------------------------------------------------------------------------------------
// Ajoute une requête à la fin de la file (FIFO)
//--------------------------------------------------------------------------------------------------
function WriteFIFO(pRequete)
{
  try
  {
    // Récupérer la file actuelle
    let lFile = [];
    const lData = localStorage.getItem(STORAGE_KEY_FIFO);

    if (lData)
    {
      lFile = JSON.parse(lData);
    }

    // Ajouter le nouvel objet à la fin
    lFile.push(pRequete);

    // Sauvegarder
    localStorage.setItem(STORAGE_KEY_FIFO, JSON.stringify(lFile));
  }
  catch (e)
  {
    console.error("Erreur WriteFIFO:", e);
  }
}

//--------------------------------------------------------------------------------------------------
// Récupère la requête la plus ancienne SANS la supprimer
//--------------------------------------------------------------------------------------------------
function PeekFIFO()
{
  try
  {
    const lData = localStorage.getItem(STORAGE_KEY_FIFO);
    if (!lData)
      return(null);

    let lFile = JSON.parse(lData);
    return (lFile.length > 0 ? lFile[0] : null);
  }
  catch (e)
  {
    console.error("Erreur PeekFIFO:", e);
    return(null);
  }
}

//--------------------------------------------------------------------------------------------------
// Supprime la requête la plus ancienne (à appeler après confirmation d'envoi)
//--------------------------------------------------------------------------------------------------
function PopFIFO()
{
  try
  {
    const lData = localStorage.getItem(STORAGE_KEY_FIFO);
    if (!lData)
      return;

    let lFile = JSON.parse(lData);
    if (lFile.length > 0)
    {
      lFile.shift(); // Retire le premier
      localStorage.setItem(STORAGE_KEY_FIFO, JSON.stringify(lFile));
    }
  }
  catch (e)
  {
    console.error("Erreur PopFIFO:", e);
  }
}

//--------------------------------------------------------------------------------------------------
// Vérifie s'il reste des requêtes en attente
//--------------------------------------------------------------------------------------------------
function CountFIFO()
{
  const lData = localStorage.getItem(STORAGE_KEY_FIFO);
  if (!lData)
    return(0);
  try
  {
    const lFile = JSON.parse(lData);
    return lFile.length;
  }
  catch (e)
  {
    return(0);
  }
}

//--------------------------------------------------------------------------------------------------
// Envoi de la requête
// Renvoie "OK" ou "Erreur .."
//--------------------------------------------------------------------------------------------------
async function EnvoiSingleRequete(nouveauPoint)
{
  console.log("Ecriture en cours");
  const t0 = performance.now();

  // Ecriture
  const lStatus = await SupabaseWrite(nouveauPoint);
  const delta = Math.round(0.100*(performance.now() - t0))/100;
  console.log("Ecriture " + lStatus + " (" + delta + "s)");
  return(lStatus);
}