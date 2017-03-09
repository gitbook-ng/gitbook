const Path = require('path');

/**
 Delete all articles that point to a file under the given path, unless
 some of their children do not share that same path.

 @param {Summary} summary
 @param {String} path Can be a file path or directory path
 @return {Summary}
*/
function deleteByPath(summary, path) {
    const parts = summary.getParts()
        .map((part) => {
            const articles = deleteArticlesByPath(part.getArticles(), path);
            return part.merge({ articles });
        });

    return summary.merge({ parts });
}

/**
 Same as `deleteByPath` but for a list of articles.

 @param {List<Article>} articles
 @param {String} path
 @return {List<Article}
 */
function deleteArticlesByPath(articles, path) {
    return articles
        // Delete leaf articles first
        .map(article => article.merge({
            articles: deleteArticlesByPath(article.articles, path)
        }))
        // Then delete top level articles if they don't have any descendant left.
        .filterNot(
            article => article.getArticles().isEmpty() && isInside(article, path)
        )
        // Unlink those left
        .map(article => isInside(article, path) ? article.merge({ ref: '' }) : article);
}

/**
 @param {Article} article
 @param {String} potentialParent
 @return {Boolean} True if path match the parent path, or if path is inside parent path
 */
function isInside(article, potentialParent) {
    // For inside-directory checking, we want to allow trailing slashes, so normalize.
    const path = stripTrailingSep(article.getPath() || '');
    potentialParent = stripTrailingSep(potentialParent);

    return path.lastIndexOf(potentialParent, 0) === 0 &&
        (
            path[potentialParent.length] === Path.sep ||
            path[potentialParent.length] === undefined
        );
}

function stripTrailingSep(path) {
    if (path[path.length - 1] === Path.sep) {
        return path.slice(0, -1);
    }
    return path;
}

module.exports = deleteByPath;