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
    lNbReq = CompteRequetes(lReq);
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
        pid('TxtEnvoiRequetesStatut').innerHTML += "<b>" + lErreurs + "</b> Erreur" + S(lErreurs) + "<br>";
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
// Envoi des requêtes pour VisuGPX et vide le buffer
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
            // Filtrer les chaînes vides

            pid("Step3").style.backgroundColor = ColEnCours;
            pid('TxtStep3').innerHTML = "<b>Envoi</b><br>";
            pid('TxtStep3').innerHTML += "Envoi de <b>" + requetesArray.length + "</b> requête" + S(requetesArray.length) + "..";

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
                pid("Step3").style.backgroundColor = ColOK;
                pid('TxtStep3').innerHTML = "<b>Envoi</b><br>"
                pid('TxtStep3').innerHTML += "<b>" + lNbReq + "</b> requête" + S(lNbReq) + " envoyée" + S(lNbReq) +"<br>";

                // On efface le buffer
                localStorage.setItem('RequetesVisuGPX', "");

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

            // Au moins une erreur, on n'efface par le buffer, tant pis pour les doublons
            else
            {
                const lErreurs = lNbReq - lRequetesEnvoyees;
                pid("Step3").style.backgroundColor = ColErreur;
                pid('TxtStep3').innerHTML = "<b>Envoi</b><br>";
                pid('TxtStep3').innerHTML += "<b>" + lErreurs + "</b> Erreur" + S(lErreurs) + "<br>";
                if (gHtmlText.startsWith("Err: Fichier non trouvé"))
                    pid('TxtStep3').innerHTML += "<i>Vérifier l'ID VisuGPX<i>";
                else if (gHtmlText.startsWith("Err: La trace doit être cachée"))
                    pid('TxtStep3').innerHTML += "<i>Modifier le type de la trace en 'Cachée'";
                else
                    pid('TxtStep3').innerHTML += "<i>" + gHtmlText + "</i>";
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
// Ajout d'un "s" si le nombre est supérieur à 1
//--------------------------------------------------------------------------------------------------
function S(pNombre)
{
  if (pNombre > 1)
      return "s";
  else
      return "";
}

//--------------------------------------------------------------------------------------------------
// Fermeture de cet écran
//--------------------------------------------------------------------------------------------------
function ButReqRetourClick()
{
  pid('scrReq').style.display = 'none';
  AfficherEcranHOME();
}


