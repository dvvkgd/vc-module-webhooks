using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Description;
using VirtoCommerce.Platform.Core.Web.Security;
using VirtoCommerce.WebHooksModule.Core;
using VirtoCommerce.WebHooksModule.Core.Models;
using VirtoCommerce.WebHooksModule.Core.Services;

namespace VirtoCommerce.WebHooksModule.Web.Controllers.Api
{
    [RoutePrefix("api/webhooks")]
    public class WebHooksController : ApiController
    {
        private readonly IWebHookSearchService _webHookSearchService;
        private readonly IWebHookFeedSearchService _webHookFeedSearchService;
        private readonly IWebHookService _webHookService;
        private readonly IWebHookManager _webHookManager;
        private readonly IRegisteredEventStore _registeredEventStore;
        private readonly IWebHookFeedService _webHookFeedService;

        public WebHooksController(IWebHookSearchService webHookSearchService,
            IWebHookFeedSearchService webHookFeedSearchService,
            IWebHookService webHookService,
            IWebHookManager webHookManager,
            IRegisteredEventStore registeredEventStore,
            IWebHookFeedService webHookFeedService)
        {
            _webHookSearchService = webHookSearchService;
            _webHookFeedSearchService = webHookFeedSearchService;
            _webHookService = webHookService;
            _webHookManager = webHookManager;
            _registeredEventStore = registeredEventStore;
            _webHookFeedService = webHookFeedService;
        }

        // GET: api/webhooks/:id
        /// <summary>
        /// Gets <see cref="WebHook"/> by id.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("{id}")]
        [ResponseType(typeof(WebHook))]
        [CheckPermission(Permission = ModuleConstants.Security.Permissions.Read)]
        public IHttpActionResult GetWebhookById(string id)
        {
            var result = _webHookService.GetByIdsAsync(new[] { id });

            return Ok(result?.FirstOrDefault());
        }

        /// <summary>
        /// Searches webhooks by certain criteria
        /// </summary>
        /// <param name="criteria"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("search")]
        [ResponseType(typeof(WebHookSearchResult))]
        [CheckPermission(Permission = ModuleConstants.Security.Permissions.Read)]
        public WebHookSearchResult Search(WebHookSearchCriteria criteria)
        {
            var result = _webHookSearchService.SearchAsync(criteria);

            return result;
        }

        /// <summary>
        /// Searches webhook logs by certain criteria
        /// </summary>
        /// <param name="criteria"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("feed/search")]
        [ResponseType(typeof(WebHookFeedSearchResult))]
        [CheckPermission(Permission = ModuleConstants.Security.Permissions.ReadFeed)]
        public WebHookFeedSearchResult SearchWebhookFeed(WebHookFeedSearchCriteria criteria)
        {
            var result = _webHookFeedSearchService.SearchAsync(criteria);

            return result;
        }

        /// <summary>
        /// Delete webHookFeeds by ids.
        /// </summary>
        /// <param name="ids">WebHook Feeds ids to delete.</param>
        /// <returns></returns>
        [HttpDelete]
        [Route("feed")]
        [ResponseType(typeof(void))]
        [CheckPermission(Permission = ModuleConstants.Security.Permissions.Delete)]
        public IHttpActionResult DeleteWebHookFeeds([FromUri] string[] ids)
        {
            _webHookFeedService.DeleteByIdsAsync(ids);

            return Ok();
        }

        /// <summary>
        /// Creates or updates the webhooks.
        /// </summary>
        /// <param name="webhooks">Webhooks to save.</param>
        /// <returns></returns>
        [HttpPost]
        [Route("")]
        [CheckPermission(Permission = ModuleConstants.Security.Permissions.Update)]
        [ResponseType(typeof(WebHook[]))]
        public IHttpActionResult SaveWebhooks(WebHook[] webhooks)
        {
            _webHookService.SaveChangesAsync(webhooks);

            return Ok(webhooks);
        }

        /// <summary>
        /// Deletes webhooks by ids.
        /// </summary>
        /// <param name="ids">Webhook ids to delete.</param>
        /// <returns></returns>
        [HttpDelete]
        [Route("")]
        [ResponseType(typeof(void))]
        [CheckPermission(Permission = ModuleConstants.Security.Permissions.Delete)]
        public IHttpActionResult DeleteWebHooks([FromUri] string[] ids)
        {
            _webHookService.DeleteByIds(ids);

            return Ok();
        }

        /// <summary>
        /// Sends request with given params to webhook and returns result
        /// </summary>
        /// <param name="testRequest">Request params.</param>
        /// <returns>Result of sent request.</returns>
        [HttpPost]
        [Route("send")]
        [ResponseType(typeof(WebHookSendResponse))]
        [CheckPermission(Permission = ModuleConstants.Security.Permissions.Execute)]
        public async Task<IHttpActionResult> Run(WebHook webHook)
        {
            var result = await _webHookManager.VerifyWebHookAsync(webHook);

            return Ok(result);
        }

        // GET: api/webhooks/events
        /// <summary>
        /// Gets all registered events that could trigger webhook notification.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("events")]
        [ResponseType(typeof(RegisteredEvent[]))]
        [CheckPermission(Permission = ModuleConstants.Security.Permissions.Read)]
        public IHttpActionResult GetAllRegisteredEvents()
        {
            var result = _registeredEventStore.GetAllEvents();

            return Ok(result);
        }
    }
}
