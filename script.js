// DOM tamamen yüklendikten sonra kodu çalıştır
document.addEventListener('DOMContentLoaded', () => {
    let board = null; // Satranç tahtasını başlat
    const game = new Chess(); // Yeni bir Chess.js oyun örneği oluştur
    const moveHistory = document.getElementById('move-history'); // Hamle geçmişi konteynerini al
    const capturedWhite = document.getElementById('captured-white');
    const capturedBlack = document.getElementById('captured-black');
    let moveCount = 1; // Hamle sayısını başlat
    let userColor = 'w'; // Kullanıcının rengini beyaz olarak başlat
   
    let whiteTime = 300;
    let blackTime = 300;
    let timerInterval;
    let activeColor = 'w';

    const updateTimerDisplay = () => {
        document.getElementById('white-time').textContent = formatTime(whiteTime);
        document.getElementById('black-time').textContent = formatTime(blackTime);
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startTimer = () => {
        clearInterval(timerInterval); // Mevcut zamanlayıcıyı durdur
        timerInterval = setInterval(() => {
            if (activeColor === 'w') {
                whiteTime--;
                if (whiteTime <= 0) {
                    clearInterval(timerInterval);
                    alert("Beyaz'ın süresi doldu! Siyah kazandı.");
                }
            } else {
                blackTime--;
                if (blackTime <= 0) {
                    clearInterval(timerInterval);
                    alert("Siyah'ın süresi doldu! Beyaz kazandı.");
                }
            }
            updateTimerDisplay();
        }, 1000); // Her saniyede bir çalışır
    };


    // Bilgisayar için rastgele hamle yapma fonksiyonu
    const updateCapturedPieces = () => {
        const history = game.history({ verbose: true });
        const whiteCaptured = [];
        const blackCaptured = [];

        history.forEach(move => {
            if (move.captured) {
                if (move.color === 'w') {
                    blackCaptured.push(move.captured);
                } else {
                    whiteCaptured.push(move.captured);
                }
            }
        });

        // Yenilen taşları göster
        capturedWhite.innerHTML = whiteCaptured.map(piece => `<img src="img/chesspieces/wikipedia/w${piece.toUpperCase()}.png" alt="${piece}">`).join('');
        capturedBlack.innerHTML = blackCaptured.map(piece => `<img src="img/chesspieces/wikipedia/b${piece.toLowerCase()}.png" alt="${piece}">`).join('');
    };


    
    const makeRandomMove = () => {
        const possibleMoves = game.moves(); // Geçerli tüm hamleleri al

        if (game.game_over()) { // Oyun bitmiş mi kontrol et
            alert("Checkmate!"); // Şah-mat uyarısı ver
        } else {
            const randomIdx = Math.floor(Math.random() * possibleMoves.length); // Rastgele bir hamle seç
            const move = possibleMoves[randomIdx];
            game.move(move); // Hamleyi yap
            board.position(game.fen()); // Tahtanın yeni pozisyonunu güncelle
            recordMove(move, moveCount); // Hamleyi kaydet ve göster
            updateCapturedPieces();
            moveCount++; // Hamle sayısını artır
            activeColor = game.turn();
            startTimer()
        }
    };

    // Hamle kaydetme ve gösterme fonksiyonu
    const recordMove = (move, count) => {
        const formattedMove = count % 2 === 1 ? `${Math.ceil(count / 2)}. ${move}` : `${move} -`; // Hamleyi formatla
        moveHistory.textContent += formattedMove + ' '; // Hamleyi hareket geçmişine ekle
        moveHistory.scrollTop = moveHistory.scrollHeight; // Geçmişin en sonuna otomatik kaydır
    };
    // Taşın hareketini daha belirgin hale getirmek için hareket yapılan kare.
    const highlightSquare = (square) => {
        document.querySelectorAll('.square-55d63').forEach(squareElement => {
            squareElement.style.backgroundColor = '';
        });
        const squareElement = document.querySelector(`.square-${square}`);
        if (squareElement) {
            squareElement.style.backgroundColor = '#a9a9a9';
        }
    };

    // Sürükleme işlemi başlangıcını kontrol eden fonksiyon
    const onDragStart = (source, piece) => {
        highlightSquare(source);
        // Kullanıcının sadece kendi taşlarını sürüklemesine izin ver
        return !game.game_over() && piece.search(userColor) === 0;
    };

    // Taş bırakma işlemini kontrol eden fonksiyon
    const onDrop = (source, target) => {
        highlightSquare(source);
        highlightSquare(target);
        const move = game.move({
            from: source, // Taşın başlangıç konumu
            to: target,   // Taşın bırakıldığı konum
            promotion: 'q', // Piyonun terfi edeceği taş (varsayılan: vezir)
        });

        if (move === null) return 'snapback'; // Geçersiz hamle ise taşı geri al

        window.setTimeout(makeRandomMove, 250); // Bilgisayarın rastgele hamle yapmasını sağla
        recordMove(move.san, moveCount); // Hamleyi kaydet ve göster
        updateCapturedPieces();
        moveCount++;
        activeColor = game.turn(); // Aktif oyuncuyu değiştir
        startTimer();
    };

    // Snap animasyonu sonlandığında tahtayı güncelleyen fonksiyon
    const onSnapEnd = () => {
        board.position(game.fen()); // Tahtanın pozisyonunu güncelle
    };

    // Satranç tahtası yapılandırma seçenekleri
    const boardConfig = {
        showNotation: true, // Tahta üzerinde notasyon göster
        draggable: true, // Taşlar sürüklenebilir
        position: 'start', // Başlangıç pozisyonu
        onDragStart, // Sürükleme başlangıcında çalışacak fonksiyon
        onDrop, // Taş bırakıldığında çalışacak fonksiyon
        onSnapEnd, // Snap animasyonu sonlandığında çalışacak fonksiyon
        moveSpeed: 'fast', // Taşların hareket hızı
        snapBackSpeed: 500, // Snap geri dönüş hızı
        snapSpeed: 100, // Snap animasyon hızı
    };

    // Satranç tahtasını başlat
    board = Chessboard('board', boardConfig);

    // "Tekrar Oyna" butonu için olay dinleyici
    document.querySelector('.play-again').addEventListener('click', () => {
        game.reset(); // Oyunu sıfırla
        board.start(); // Tahtayı başlangıç pozisyonuna döndür
        moveHistory.textContent = ''; // Hamle geçmişini temizle
        moveCount = 1; // Hamle sayısını sıfırla
        userColor = 'w'; // Kullanıcı rengini beyaz olarak ayarla
        capturedWhite.innerHTML = '';
        capturedBlack.innerHTML = '';

        whiteTime = 300; // Süreyi sıfırla
        blackTime = 300;
        activeColor = 'w'; // Beyaz ile başla
        updateTimerDisplay();
        clearInterval(timerInterval); // Zamanlayıcıyı sıfırla
        startTimer();
    });

    // "Tahtayı Çevir" butonu için olay dinleyici
    document.querySelector('.flip-board').addEventListener('click', () => {
        board.flip(); // Tahtayı çevir
        makeRandomMove(); // Bilgisayarın hamle yapmasını sağla
        userColor = userColor === 'w' ? 'b' : 'w'; // Kullanıcı rengini değiştir
    });

    updateTimerDisplay();
    startTimer();

});
